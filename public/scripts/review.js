document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.querySelector(".review-submit");
    const animeId = document.querySelector("#anime-id").value;

    submitBtn.addEventListener("click", async () => {
        const reviewTitleInput = document.querySelector(".review-title-input");
        const reviewContentText = document.querySelector(".review-content-text");
        const form = document.querySelector(".review-content");
        const reviewTitle = document.querySelector(".review-title-input").value;
        const review = document.querySelector(".review-content-text").value;
        if (reviewTitle.length != 0 && review.length != 0) {
            try {
                const sendReview = await axios.post("/addReview", { animeId, reviewTitle, review });
                console.log(`sent`);
                console.log(` title ${reviewTitle} and review: ${review}`);
                if (sendReview.data.response === "added") {
                    console.log(sendReview.data.response);
                    reviewTitleInput.value = "";
                    reviewContentText.value = "";
                    alert(sendReview.data.message);
                } else {
                    alert(sendReview.data.message);
                }
            } catch (err) {
                console.error(err);
            }

        }
    });

});