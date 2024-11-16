package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
)

type Filing struct {
	FilingID    string    `json:"filingId"`
	Ticker      string    `json:"ticker"`
	CompanyName string    `json:"companyName"`
	FilingURL   string    `json:"filingUrl"`
	StoredURL   string    `json:"storedUrl"`
	AccessionNo string    `json:"accessionNo"`
	FormType    string    `json:"formType"`
	FiledAt     time.Time `json:"filedAt"`
	LastUpdated time.Time `json:"lastUpdated"`
}

var (
	firestoreClient *firestore.Client
	storageClient   *storage.Client
	ctx             = context.Background()
	bucketName      = "filing-pdf"
	apiKey          = "9b33268df768f2747a8dbac25da79a1dfbc5523ae7a3805bb61d5aa12fd122ab"
	projectID       = "platinum-chain-441122-f5"
)

func main() {
	log.Println("Initializing Firestore and Google Cloud Storage...")
	if err := initFirestore(); err != nil {
		log.Fatalf("Failed to initialize Firestore: %v", err)
	}
	defer firestoreClient.Close()

	if err := initStorage(); err != nil {
		log.Fatalf("Failed to initialize Google Cloud Storage: %v", err)
	}
	defer storageClient.Close()

	log.Println("Starting API server on port 8080")
	http.HandleFunc("/api/view", handleFilingRequest)
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initFirestore() error {
	sa := option.WithCredentialsFile("./platinum-chain-token-service.json")
	var err error
	firestoreClient, err = firestore.NewClient(ctx, projectID, sa)
	return err
}

func initStorage() error {
	sa := option.WithCredentialsFile("./platinum-chain-token-service.json")
	var err error
	storageClient, err = storage.NewClient(ctx, sa)
	return err
}

func handleFilingRequest(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to handle filing.")

	var filingData Filing
	err := json.NewDecoder(r.Body).Decode(&filingData)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	if filingData.FilingID == "" || filingData.FilingURL == "" {
		http.Error(w, "Missing reportId or filingUrl parameter", http.StatusBadRequest)
		return
	}

	fileURL, err := processFiling(filingData)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to process filing: %v", err), http.StatusInternalServerError)
		return
	}

	log.Println("Filing processed successfully. Sending response.")
	response := map[string]string{"fileURL": fileURL}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func processFiling(filingData Filing) (string, error) {
	log.Printf("Processing filing for ID: %s\n", filingData.FilingID)
	docRef := firestoreClient.Collection("financialReports").Doc(filingData.FilingID)
	doc, err := docRef.Get(ctx)
	if err == nil && doc.Exists() {
		var existingFiling Filing
		if err := doc.DataTo(&existingFiling); err != nil {
			return "", fmt.Errorf("failed to decode Firestore document: %v", err)
		}
		exists, gcsErr := checkFileInGCS(filingData.FilingID)
		if gcsErr != nil {
			return "", fmt.Errorf("error checking file in GCS: %v", gcsErr)
		}
		if exists {
			log.Println("File already exists in GCS.")
			return existingFiling.StoredURL, nil
		}
	}

	log.Println("Downloading file from SEC API...")
	downloadURL := fmt.Sprintf("https://api.sec-api.io/filing-reader?token=%s&url=%s", apiKey, filingData.FilingURL)
	fileData, err := downloadFile(downloadURL)
	if err != nil {
		return "", fmt.Errorf("failed to download filing: %v", err)
	}

	log.Println("Storing file in GCS...")
	storedURL, err := storeInGCS(filingData.FilingID, fileData)
	if err != nil {
		return "", fmt.Errorf("failed to store file in GCS: %v", err)
	}

	filingData.StoredURL = storedURL
	filingData.LastUpdated = time.Now()
	if _, err := docRef.Set(ctx, filingData); err != nil {
		return "", fmt.Errorf("failed to save metadata to Firestore: %v", err)
	}
	log.Println("Filing data stored in Firestore successfully.")
	return storedURL, nil
}

func checkFileInGCS(reportID string) (bool, error) {
	objName := fmt.Sprintf("filings/%s.pdf", reportID)
	_, err := storageClient.Bucket(bucketName).Object(objName).Attrs(ctx)

	if err == storage.ErrObjectNotExist {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func downloadFile(url string) ([]byte, error) {
	log.Printf("Downloading file from URL: %s\n", url)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func storeInGCS(reportID string, fileData []byte) (string, error) {
	objName := fmt.Sprintf("filings/%s.pdf", reportID)
	writer := storageClient.Bucket(bucketName).Object(objName).NewWriter(ctx)

	if _, err := writer.Write(fileData); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, objName)
	log.Printf("File stored successfully in GCS: %s\n", url)
	return url, nil
}
