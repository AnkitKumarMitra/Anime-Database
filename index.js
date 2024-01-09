import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL = `https://api.jikan.moe/v4/`;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    try {
        const topAnimeResponse = await axios.get(`${API_URL}top/anime`);
        const topAnimeData = topAnimeResponse.data;

        const currentlyAiringAnimeResponse = await axios.get(`${API_URL}seasons/now`);
        const currentlyAiringData = currentlyAiringAnimeResponse.data;

        const nextSeasonAnimeResponse = await axios.get(`${API_URL}seasons/upcoming`);
        const nextSeasonAnimeData = nextSeasonAnimeResponse.data;

        const randomAnimeResponse = await axios.get(`${API_URL}random/anime`);
        const randomAnimeData = randomAnimeResponse.data;

        res.render("index.ejs", {
            topAnime: topAnimeData,
            currentAnime: currentlyAiringData,
            upcomingAnime: nextSeasonAnimeData,
            randomAnime: randomAnimeData
        })
    } catch (error) {
        res.render("index.html")
    }
});

app.get("/search", async (req, res) => {
    const searchItem = req.query.anime;
    const getSearchItem = await axios.get(`${API_URL}anime?q=${searchItem}`);
    const searchItemList = getSearchItem.data;
    res.json(searchItemList.data);
});

app.listen(port, () => {
    console.log(`Server running at port: ${port}.`);
})