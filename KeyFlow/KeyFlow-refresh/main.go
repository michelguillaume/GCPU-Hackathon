package main

import (
	"context"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/robfig/cron/v3"
	"google.golang.org/api/option"
)

var client *firestore.Client
var ctx = context.Background()

func initFirestore() {
	sa := option.WithCredentialsFile("./platinum-chain-token-service.json")
	var err error
	client, err = firestore.NewClient(ctx, "platinum-chain-441122-f5", sa)
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	log.Println("Firestore client initialized successfully.")
}

func resetStatusIfNeeded() {
	log.Println("Reset script started...")
	iter := client.Collection("tokens").Where("status", "==", "used").Documents(ctx)
	now := time.Now()
	count := 0

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		lastModified, err := doc.DataAt("last_modified")
		if err != nil {
			continue
		}

		lastModTime, ok := lastModified.(time.Time)
		if !ok {
			continue
		}

		if lastModTime.Year() != now.Year() || lastModTime.Month() != now.Month() || lastModTime.Day() != now.Day() {
			_, err := doc.Ref.Update(ctx, []firestore.Update{
				{Path: "status", Value: "available"},
				{Path: "last_modified", Value: now},
			})
			if err == nil {
				count++
			}
		}
	}

	log.Printf("Reset completed. %d keys reset to 'available' status.", count)
}

func main() {
	initFirestore()
	defer client.Close()

	log.Println("Starting cron job...")

	c := cron.New()
	_, err := c.AddFunc("1 0 * * *", resetStatusIfNeeded)
	if err != nil {
		log.Fatalf("Failed to schedule reset job: %v", err)
	}

	// Start the cron scheduler and run the reset immediately once
	c.Start()
	log.Println("Cron job scheduled to run daily at 00:01.")

	// Run the reset function immediately on startup
	resetStatusIfNeeded()

	select {} // Keep server running for cron jobs
}
