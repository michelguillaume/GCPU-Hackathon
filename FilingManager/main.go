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
	apiKeys         = []string{
		"9f392a8ba5289a9749242ccce00ab9c0696ed45993e56a729ceaa4f739998163",
		"api_key_2",
		"api_key_3",
	}
	currentAPIKeyIndex = 0
	projectID          = "platinum-chain-441122-f5"
)

func getCurrentAPIKey() string {
	return apiKeys[currentAPIKeyIndex]
}

func rotateAPIKey() {
	currentAPIKeyIndex = (currentAPIKeyIndex + 1) % len(apiKeys)
	log.Printf("Rotating to next API key: %s", getCurrentAPIKey())
}

func main() {
	log.Println("Starting application...")

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
	log.Println("Initializing Firestore...")
	//sa := option.WithCredentialsFile("./platinum-chain-token-service.json")
	sa := option.WithCredentialsFile("/secrets/key.json")
	var err error
	firestoreClient, err = firestore.NewClient(ctx, projectID, sa)
	if err != nil {
		log.Printf("Firestore initialization failed: %v", err)
		return err
	}
	log.Println("Firestore initialized successfully.")
	return nil
}

func initStorage() error {
	log.Println("Initializing Google Cloud Storage...")
	//sa := option.WithCredentialsFile("./platinum-chain-token-service.json")
	sa := option.WithCredentialsFile("/secrets/key.json")
	var err error
	storageClient, err = storage.NewClient(ctx, sa)
	if err != nil {
		log.Printf("Google Cloud Storage initialization failed: %v", err)
		return err
	}
	log.Println("Google Cloud Storage initialized successfully.")
	return nil
}

func handleFilingRequest(w http.ResponseWriter, r *http.Request) {
	log.Println("Received API request to handle filing.")

	var filingData Filing
	err := json.NewDecoder(r.Body).Decode(&filingData)
	if err != nil {
		log.Printf("Invalid JSON data: %v", err)
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	log.Printf("Filing request data: %+v", filingData)
	if filingData.FilingID == "" || filingData.FilingURL == "" {
		log.Println("Missing required parameters: FilingID or FilingURL.")
		http.Error(w, "Missing reportId or filingUrl parameter", http.StatusBadRequest)
		return
	}

	fileURL, err := processFiling(filingData)
	if err != nil {
		log.Printf("Failed to process filing: %v", err)
		http.Error(w, fmt.Sprintf("Failed to process filing: %v", err), http.StatusInternalServerError)
		return
	}

	log.Println("Filing processed successfully. Sending response.")
	response := map[string]string{"fileURL": fileURL}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func processFiling(filingData Filing) (string, error) {
	log.Printf("Processing filing for ID: %s", filingData.FilingID)
	docRef := firestoreClient.Collection("financialReports").Doc(filingData.FilingID)
	doc, err := docRef.Get(ctx)
	if err == nil && doc.Exists() {
		var existingFiling Filing
		if err := doc.DataTo(&existingFiling); err != nil {
			log.Printf("Failed to decode Firestore document: %v", err)
			return "", fmt.Errorf("failed to decode Firestore document: %v", err)
		}
		exists, gcsErr := checkFileInGCS(filingData.FilingID)
		if gcsErr != nil {
			log.Printf("Error checking file in GCS: %v", gcsErr)
			return "", fmt.Errorf("error checking file in GCS: %v", gcsErr)
		}
		if exists {
			log.Println("File already exists in GCS.")
			return existingFiling.StoredURL, nil
		}
	}

	log.Println("Downloading file from SEC API...")
	fileData, err := downloadFile(filingData.FilingURL)
	if err != nil {
		log.Printf("Failed to download filing: %v", err)
		return "", fmt.Errorf("failed to download filing: %v", err)
	}

	log.Println("Storing file in GCS...")
	storedURL, err := storeInGCS(filingData.FilingID, fileData)
	if err != nil {
		log.Printf("Failed to store file in GCS: %v", err)
		return "", fmt.Errorf("failed to store file in GCS: %v", err)
	}

	filingData.StoredURL = storedURL
	filingData.LastUpdated = time.Now()
	if _, err := docRef.Set(ctx, filingData); err != nil {
		log.Printf("Failed to save metadata to Firestore: %v", err)
		return "", fmt.Errorf("failed to save metadata to Firestore: %v", err)
	}
	log.Println("Filing data stored in Firestore successfully.")
	return storedURL, nil
}

func checkFileInGCS(reportID string) (bool, error) {
	objName := fmt.Sprintf("filings/%s.pdf", reportID)
	log.Printf("Checking if file exists in GCS: %s", objName)
	_, err := storageClient.Bucket(bucketName).Object(objName).Attrs(ctx)

	if err == storage.ErrObjectNotExist {
		log.Println("File does not exist in GCS.")
		return false, nil
	}
	if err != nil {
		log.Printf("Error while accessing GCS: %v", err)
		return false, err
	}
	log.Println("File exists in GCS.")
	return true, nil
}

func downloadFile(url string) ([]byte, error) {
	for i := 0; i < len(apiKeys); i++ {
		currentKey := getCurrentAPIKey()
		requestURL := fmt.Sprintf("https://api.sec-api.io/filing-reader?token=%s&url=%s", currentKey, url)
		log.Printf("Downloading file using API key: %s", currentKey)

		resp, err := http.Get(requestURL)
		if err != nil {
			log.Printf("HTTP GET failed: %v", err)
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusTooManyRequests {
			log.Println("API key rate limit exceeded. Rotating API key...")
			rotateAPIKey()
			continue
		}

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			log.Printf("Unexpected status code %d: %s", resp.StatusCode, string(body))
			return nil, fmt.Errorf("failed to download file, status code: %d", resp.StatusCode)
		}

		data, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("Failed to read response body: %v", err)
			return nil, err
		}
		log.Println("File downloaded successfully.")
		return data, nil
	}

	return nil, fmt.Errorf("all API keys exhausted, unable to download file")
}

func storeInGCS(reportID string, fileData []byte) (string, error) {
	objName := fmt.Sprintf("filings/%s.pdf", reportID)
	log.Printf("Uploading file to GCS with object name: %s", objName)
	writer := storageClient.Bucket(bucketName).Object(objName).NewWriter(ctx)

	if _, err := writer.Write(fileData); err != nil {
		log.Printf("Error writing file to GCS: %v", err)
		return "", err
	}
	if err := writer.Close(); err != nil {
		log.Printf("Error closing writer for GCS: %v", err)
		return "", err
	}

	url := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, objName)
	log.Printf("File uploaded successfully to GCS: %s", url)
	return url, nil
}
