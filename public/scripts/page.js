
document.addEventListener('DOMContentLoaded', () => {

    const favBtn = document.querySelector('.fav-btn');
    const watchBtn = document.querySelector('.watch-list-btn');
    const selectElement = document.querySelector('.status');
    const scoreField = document.querySelector('.score-field');
    const episodeField = document.querySelector('.episode-field');
    const anime_id = document.getElementById("anime-id").value;
    const maxEpisode = document.querySelector(".max-episode").value;

    favBtn.addEventListener("click", async () => {
        const id = favBtn.value;
        const result = await axios.post("/toggleFav", { id });

        if (result.data.response === "added") {
            favBtn.innerHTML = 'Remove from favorites';
            console.log("Added to favorites")
        } else if (result.data.response === "removed") {
            favBtn.innerHTML = 'Add to favorites';
            console.log("Removed from favorites")
        } else if (result.data.response === "error") {
            alert("ERROR! Cant add or remove from favorites!");
            console.log("Error Occured");
        }
    });

    watchBtn.addEventListener("click", async () => {
        const id = watchBtn.value;
        const result = await axios.post("/addToWatchList", { id });

        if (result.data.response === "added") {
            watchBtn.innerHTML = 'Remove from watchlist';
            selectElement.disabled = false;
            console.log("Added to watchlist")
        } else if (result.data.response === "removed") {
            watchBtn.innerHTML = 'Add to watchlist';
            selectElement.disabled = true;
            selectElement.value = "Plan to watch";
            console.log("Removed from watchlist")
        } else if (result.data.response === "error") {
            alert("ERROR! Cant add or remove from watchlist!");
            console.log("Error Occured");
        }
    });

    selectElement.addEventListener("change", async () => {
        const status = selectElement.value;
        console.log(anime_id);
        const result = await axios.post("/setStatus", { status, anime_id });
        console.log(result.data.message);
    });

    scoreField.addEventListener("change", async () => {
        const score = scoreField.value;
        if (score >= 0 && score <= 10) {
            if (score.length <= 2) {
                console.log(`score given: ${score}`);
                const result = await axios.post("/updateScore", { score, anime_id });
                alert(result.data.message);
            }
        }
    });

    episodeField.addEventListener("change", async () => {
        const episode = episodeField.value;
        if (episode >= 0 && episode <= maxEpisode) {
            if (episode.length <= maxEpisode.length) {
                const result = await axios.post("/updateEpisode", { episode, anime_id });
                console.log(result.data.message);
            }
        }
    })

    

});