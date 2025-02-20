console.log('Server-side code running');
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); 
const app = express();
const port = 7000;

app.use(cors()); 

const db = new sqlite3.Database('db.sqlite');
const currency_converter_key = "fca_live_aMBjtnxQjIT1BRsAhfm0ugmaGiQcWMafYx1iqtqu";
const currency_converter_url = "https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_aMBjtnxQjIT1BRsAhfm0ugmaGiQcWMafYx1iqtqu";

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS currency_rates (currency TEXT, rate REAL)");
});

function getCurrencyRates() {
    axios.get(currency_converter_url)
        .then(response => {
            const rates = response.data.data;
            console.log(rates);
            storeCurrencyRates(rates);
            console.log("Hurray! Data Stored in DB");
        })
        .catch(error => {
            console.log(error);
        });
}

function storeCurrencyRates(rates) {
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO currency_rates (currency, rate) VALUES (?, ?)");
        for (const [currency, rate] of Object.entries(rates)) {
            stmt.run(currency, rate);
        }
        stmt.finalize();
    });
}

app.get('/currency-rates', (req, res) => {
    db.all("SELECT currency, rate FROM currency_rates", [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(rows);
    });
});

getCurrencyRates();

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});