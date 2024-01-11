document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById("searchInput");
    const resultContainer = document.getElementById("result");

    searchInput.addEventListener("click", function () {
        if (searchInput.value !== "") {
            const items = document.querySelectorAll(".searchEle");
            if (items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].style.display === "none") {
                        items[i].style.display = "block";
                    } else {
                        items[i].style.display = "none";
                    }
                }
            }
        }
    });

    searchInput.addEventListener("input", debounce(fetchResults, 700))

    async function fetchResults() {
        const searchItem = searchInput.value.trim();
        if (searchItem.length === 0) {
            toggleItemsVisibility(false);
        } else {
            const response = await axios.get(`/search?anime=${searchItem}`);
            displayItems(response.data);
        }
    };

    function displayItems(result) {
        console.log(result);
        if (Array.isArray(result)) {
            resultContainer.innerHTML = result.map(result => `<li class="border searchEle"><a href="/anime/${result.mal_id}"><img src="${result.images.jpg.small_image_url}"><div><p><u>${result.title}</u></p><p>Year: ${result.year}</p><p>Score: ${result.score}</p><p>Status: ${result.status}</p></div></a></li>`).join("");
        } else {
            resultContainer.innerHTML = 'Result not found';
        }
    };

    function toggleItemsVisibility(show) {
        const items = document.getElementsByClassName("searchEle");
        for (const item of items) {
            item.style.display = show ? "block" : "none";
        }
    }

    function debounce(func, delay) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }
});