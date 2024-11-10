package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

var client *firestore.Client
var ctx = context.Background()

func initFirestore() {
	sa := option.WithCredentialsFile("/secrets/key.json")
	var err error
	client, err = firestore.NewClient(ctx, "platinum-chain-441122-f5", sa)
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
}

// Route to get a specified number of available keys
func getKeys(w http.ResponseWriter, r *http.Request) {
	numKeysStr := r.URL.Query().Get("count")
	numKeys, err := strconv.Atoi(numKeysStr)
	if err != nil || numKeys <= 0 {
		http.Error(w, "Invalid 'count' parameter", http.StatusBadRequest)
		log.Printf("GET /getKeys - Invalid 'count' parameter: %v", numKeysStr)
		return
	}

	iter := client.Collection("tokens").Where("status", "==", "available").Limit(numKeys).Documents(ctx)
	keys := []string{}
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		keys = append(keys, doc.Ref.ID)
	}

	log.Printf("GET /getKeys - Retrieved %d keys (Requested: %d)", len(keys), numKeys)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(keys)
}

// Route to mark a list of keys as used
func markKeysUsed(w http.ResponseWriter, r *http.Request) {
	var keys []string
	if err := json.NewDecoder(r.Body).Decode(&keys); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		log.Println("POST /markKeysUsed - Invalid request body")
		return
	}

	successCount := 0
	for _, key := range keys {
		_, err := client.Collection("tokens").Doc(key).Update(ctx, []firestore.Update{
			{Path: "status", Value: "used"},
			{Path: "last_modified", Value: time.Now()},
		})
		if err == nil {
			successCount++
		}
	}

	log.Printf("POST /markKeysUsed - Successfully marked %d of %d keys as used", successCount, len(keys))

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Keys updated successfully")
}

// Route to get the count of available keys
func getAvailableKeyCount(w http.ResponseWriter, r *http.Request) {
	iter := client.Collection("tokens").Where("status", "==", "available").Documents(ctx)
	count := 0
	for {
		_, err := iter.Next()
		if err != nil {
			break
		}
		count++
	}

	log.Printf("GET /getAvailableKeyCount - Counted %d available keys", count)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{
		"available_keys_count": count,
	})
}

func main() {
	initFirestore()
	defer client.Close()

	http.HandleFunc("/getKeys", getKeys)
	http.HandleFunc("/markKeysUsed", markKeysUsed)
	http.HandleFunc("/getAvailableKeyCount", getAvailableKeyCount)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[KeyFlow] Server listening on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
