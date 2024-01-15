import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

const app = express();
const port = 3000;
const API_URL = `https://api.jikan.moe/v4/`;
env.config();
const saltRounds = process.env.SALT_ROUNDS;
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "AnimeDB",
    password: process.env.YOUR_PASSWORD,
    port: "5433"
});

let currentUser = 0;

async function getCurrentUser() {
    if (currentUser === 0) {
        return null;
    }
    try {
        const result = await db.query(
            "SELECT * FROM users;"
        );
        const users = result.rows;
        return users.find((user) => user.user_id == currentUser) || null;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
};

async function isFavorite(animeId) {
    try {
        const result = await db.query("SELECT * FROM favoritelist WHERE animeid = $1 AND user_id = $2;", [animeId, currentUser]);
        return result.rows.length > 0;
    } catch (error) {
        console.error("Error checking favorite status:", error);
        throw error;
    }
};

async function getAnimeDetails(animeId) {
    try {
        const result = await db.query("SELECT * FROM animelist WHERE anime_id = $1 AND user_id = $2;", [animeId, currentUser]);
        return {
            hasRows: result.rows.length > 0,
            rows: result.rows
        };
    } catch (error) {
        console.error("Error checking watchlist status:", error);
        throw error;
    }
};

function getDate() {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const monthIndex = currentDate.getMonth();
    const threeLetterMonth = monthNames[monthIndex];
    const year = String(currentDate.getFullYear()).slice(-2);

    return `${day}-${threeLetterMonth}-${year}`;
}

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
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

        const user = await getCurrentUser();

        res.render("index.ejs", {
            topAnime: topAnimeData,
            currentAnime: currentlyAiringData,
            upcomingAnime: nextSeasonAnimeData,
            randomAnime: randomAnimeData,
            userDetails: user
        })
    } catch (error) {
        console.error(error);
    }
});

app.get("/home", (req, res) => {
    res.redirect("/");
});

app.get("/signout", (req, res) => {
    currentUser = 0;
    res.redirect("/");
});

app.get("/search", async (req, res) => {
    const searchItem = req.query.anime;
    const getSearchItem = await axios.get(`${API_URL}anime?q=${searchItem}`);
    const searchItemList = getSearchItem.data;
    res.json(searchItemList.data);
});

app.get("/anime/:id", async (req, res) => {
    const id = req.params.id;
    const response = await axios.get(`${API_URL}anime/${id}/full`)
    const review = await db.query(
        "SELECT users.user_name, animelist.score, reviews.date, reviews.review_title, reviews.review FROM reviews JOIN users ON users.user_id = reviews.user_id LEFT JOIN animelist ON animelist.anime_id = reviews.anime_id AND animelist.user_id = reviews.user_id WHERE reviews.anime_id = $1 ORDER BY reviews.id DESC;",
        [id]
    );
    const result = response.data;
    const user = await getCurrentUser();
    const isFav = await isFavorite(id);
    const isInList = await getAnimeDetails(id);
    res.render("anime.ejs", {
        details: result.data,
        userDetails: user,
        isFavorite: isFav,
        watchList: isInList,
        reviews: review.rows
    });
});

app.get("/signin", (req, res) => {
    res.render("login.ejs");
});

app.get("/registerUser", (req, res) => {
    res.render("register.ejs");
});

app.post("/register", async (req, res) => {
    try {
        const existingUser = await db.query("SELECT * FROM users WHERE email = $1;", [req.body.email]);

        if (existingUser.rows.length > 0) {
            console.log(`User with email ${req.body.email} already exists.`);
            return res.status(400).send("User with this email already exists");
        } else {
            bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Internal Server Error");
                } else {
                    const newUser = await db.query("INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING *;", [req.body.username, req.body.email, hash]);
                    console.log("New User Created:", newUser.rows[0].user_name);
                    currentUser = newUser.rows[0].user_id;
                    console.log("id: ", currentUser);
                    res.redirect("/");
                }
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const loggedInUser = await db.query("SELECT * FROM users WHERE user_name = $1 OR email = $1;", [req.body.username]);
        const users = loggedInUser.rows;

        if (users.length === 0) {
            return res.status(401).send("Invalid username or password");
        }

        const matchingUser = users.find(user => (user.user_name === req.body.username || user.email === req.body.username) && bcrypt.compare(req.body.password, user.password));

        if (matchingUser) {
            currentUser = matchingUser.user_id;
            console.log(`${matchingUser.user_name} with id ${currentUser} logged in.`);
            res.redirect("/");
        } else {
            res.status(404).send("Invalid user name or password");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }

});

app.post("/toggleFav", async (req, res) => {
    if (currentUser != 0) {
        const user = await getCurrentUser();
        const data = req.body;
        const isFavorite = await db.query("SELECT * FROM favoritelist WHERE animeid = $1 AND user_id = $2;", [data.id, user.user_id]);
        if (isFavorite.rows.length > 0) {
            const user = await getCurrentUser();
            const data = req.body;
            console.log(`Received Anime id: ${data.id} to remove from favorites for user id: ${user.user_id} name: ${user.user_name}`);
            const removeFav = await db.query("DELETE FROM  favoritelist WHERE animeid = $1 AND user_id = $2;", [data.id, user.user_id]);
            console.log("Removed from favorites");
            res.json({
                message: `Anime with id: ${data.id} Removed Favorites`,
                response: "removed"
            });
        } else {
            console.log(`Received Anime id: ${data.id} to add to favorites for user id: ${user.user_id} name: ${user.user_name}`);
            const addFav = await db.query("INSERT INTO favoritelist (animeid, user_id) VALUES ($1, $2);", [data.id, user.user_id]);
            console.log("Added to favorites");
            res.json({
                message: `Anime with id: ${data.id} Added to Favorites`,
                response: "added"
            });
        }
    } else {
        res.json({
            message: `Log in to add to favorites.`,
            response: "error"
        });
    }
});

app.post("/addToWatchList", async (req, res) => {
    if (currentUser != 0) {
        const user = await getCurrentUser();
        const data = req.body;
        const checkList = await db.query("SELECT * FROM animelist WHERE anime_id = $1 AND user_id = $2;", [data.id, user.user_id]);
        if (checkList.rows.length > 0) {
            const removeAnimeFromList = await db.query("DELETE FROM animelist WHERE anime_id = $1 AND user_id = $2;", [data.id, user.user_id]);
            console.log("Removed from watchlist");
            res.json({
                message: "Removed from watchlist",
                response: "removed"
            })
        } else {
            const addAnimeToWatchList = await db.query(
                "INSERT INTO animelist (anime_id, score, episodes, status, user_id) VALUES ($1, 0, 1, 'Plan to watch', $2);", [data.id, user.user_id]
            );
            console.log("Added to watchlist")
            res.json({
                message: "Added to watchlist",
                response: "added"
            });
        }
    } else {
        res.json({
            message: "Log in to add to watchlist.",
            response: "error"
        });
    }
});

app.post("/setStatus", async (req, res) => {
    if (currentUser != 0) {
        const user = await getCurrentUser();
        const data = req.body;
        const getAnimeRow = await db.query("SELECT * FROM animelist WHERE anime_id = $1 AND user_id = $2;", [data.anime_id, user.user_id]);
        console.log(getAnimeRow.rows);
        if (getAnimeRow.rows.length > 0) {
            console.log(`Status before change${getAnimeRow.rows}`);
            const updateRow = await db.query("UPDATE animelist SET status = $1 WHERE anime_id = $2 AND user_id = $3;", [data.status, data.anime_id, user.user_id]);
            console.log(`Update status for anime ${data.anime_id} of user ${user.user_id}`);
            res.json({
                message: `Status Updated`,
                response: `updated`
            });
        } else {
            res.json({
                message: "Add anime to your watchlist first",
                response: `failed`
            });
        }
    } else {
        res.json({
            message: "An error occured",
            response: `error`
        });
    }
});

app.post("/updateScore", async (req, res) => {
    if (currentUser != 0) {
        const user = await getCurrentUser();
        const data = req.body;
        const getAnimeRow = await db.query("SELECT * FROM animelist WHERE anime_id = $1 AND user_id = $2;", [data.anime_id, user.user_id]);
        if (getAnimeRow.rows.length > 0) {
            const updateScore = await db.query("UPDATE animelist SET score = $1 WHERE anime_id = $2 AND user_id = $3;", [data.score, data.anime_id, user.user_id]);
            console.log(`update Score`);
            res.json({
                message: `Score Updated`,
                reponse: 'updated'
            });
        } else {
            res.json({
                message: "Add anime to you watchlist first",
                response: `error`
            });
        }
    } else {
        res.json({
            message: "An error occured",
            response: `error`
        });
    }
});

app.post("/updateEpisode", async (req, res) => {
    if (currentUser != 0) {
        const user = await getCurrentUser();
        const data = req.body;
        const getAnimeRow = await db.query("SELECT * FROM animelist WHERE anime_id = $1 AND user_id = $2;", [data.anime_id, user.user_id]);
        if (getAnimeRow.rows.length > 0) {
            const updateScore = await db.query("UPDATE animelist SET episodes = $1 WHERE anime_id = $2 AND user_id = $3;", [data.episode, data.anime_id, user.user_id]);
            console.log(`episode updated`);
            res.json({
                message: `Episode Updated`,
                reponse: 'updated'
            });
        } else {
            res.json({
                message: `Add anime to you watchlist first`,
                reponse: 'updated'
            });
        }
    } else {
        res.json({
            message: "An error occured",
            response: `error`
        });
    }
});

app.post("/addReview", async (req, res) => {
    if (currentUser != 0) {
        const user = await getCurrentUser();
        const data = req.body;
        const date = getDate();
        try {
            console.log(`recieved`);
            const addReview = await db.query(
                "INSERT INTO reviews (anime_id, review_title, review, date, user_id) VALUES ($1, $2, $3, $4, $5)",
                [data.animeId, data.reviewTitle, data.review, date, user.user_id]
            );
            console.log(`{req.body} added`);
            res.json({
                message: "Review Added",
                response: "added"
            });
        } catch (error) {
            console.error(error);
            res.json({
                message: "Cannot add review",
                response: "failed"
            });
        }

    } else {
        res.json({
            message: "Login to add review",
            reposne: "failed"
        })
    }
});

app.listen(port, () => {
    console.log(`Server running at port: ${port}.`);
})
