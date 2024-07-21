//dotenv, express, assemblyai, deepl-node(replaced with rapid api google translate)
const express = require("express");
const axios = require("axios")
const {AssemblyAI} = require("assemblyai");
require("dotenv").config()

//instantizing assemblyai client
const Client = new AssemblyAI({apiKey:process.env.ASSEMBLY_AI_API}) //use whenever you want assembly ai to do something

//configure express and port
const app = express()
const port = 3000

app.use(express.static("public"));
app.use(express.static("views"));
app.use(express.json());

//setting up google translate using rapidapi
const getTranslateOptions = (text, target_lang) => {
    const data = new URLsearchParams()
    data.append('q', text) //whatever is heard
    data.append('target', target_lang);
    data.append('source', 'en');

    return {
        method: 'POST',
        url: 'https://google-translate1.p.rapidapi.com/language/translate/v2/detect',
        headers: {
            'x-rapidapi-key': process.env.RAPID_API_KEY,
            'x-rapidapi-host': 'google-translate1.p.rapidapi.com',
            'Accept-Encoding': 'application/gzip'
        },
        data: data
    }
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/token", async (req, res) => {
    const token = await Client.realtime.createTemporaryToken({expires_in:300});
    res.json(token)
});

app.post("/translate", async (req, res) => {
    //const target_lang = document.getElementById("translation-language").value
    //target_lang = french
    const {text, target_lang} = req.body;
    try {
        const options = getTranslateOptions(text, target_lang)
        const translation = await axios.request(options)
        res.json(translation.data)    
    } catch (error) {
        res.status(500).json({error: error.message})
    } 
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});