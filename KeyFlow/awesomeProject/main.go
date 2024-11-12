package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sync"
)

// Fonction pour récupérer la liste des clés à partir de votre API
func fetchKeys(count int) ([]string, error) {
	url := fmt.Sprintf("http://34.155.28.47/getKeys?count=%d", count)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("Erreur lors de la requête : %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Erreur de réponse de l'API : %v", resp.Status)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Erreur lors de la lecture de la réponse : %v", err)
	}

	var keys []string
	if err := json.Unmarshal(body, &keys); err != nil {
		return nil, fmt.Errorf("Erreur lors du décodage JSON : %v", err)
	}

	return keys, nil
}

// Fonction pour appeler l'API Alpha Vantage avec une clé
func fetchAlphaVantageData(apiKey string, wg *sync.WaitGroup) {
	defer wg.Done()

	url := fmt.Sprintf("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=5min&outputsize=full&extended_hours=false&month=2000-01&adjusted=true&datatype=json&apikey=%s", apiKey)
	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Erreur lors de la requête à Alpha Vantage avec la clé %s : %v", apiKey, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Erreur de réponse de l'API Alpha Vantage avec la clé %s : %v", apiKey, resp.Status)
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Erreur lors de la lecture de la réponse avec la clé %s : %v", apiKey, err)
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("Erreur lors du décodage JSON avec la clé %s : %v", apiKey, err)
		return
	}

	fmt.Printf("Données Alpha Vantage pour la clé %s : %v\n", apiKey, result)
}

func main() {
	keys, err := fetchKeys(29000)
	if err != nil {
		log.Fatalf("Erreur lors de la récupération des clés : %v", err)
	}

	var wg sync.WaitGroup

	// Pour chaque clé, lancer une goroutine pour appeler l'API Alpha Vantage
	for _, key := range keys {
		wg.Add(1)
		go fetchAlphaVantageData(key, &wg)
	}

	// Attendre la fin de toutes les goroutines
	wg.Wait()
	log.Println("Tous les appels à l'API Alpha Vantage ont été complétés.")
}
