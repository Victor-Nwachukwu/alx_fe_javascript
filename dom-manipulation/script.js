// Initialize Quotes array
let quotes = [
  { text: "Be yourself; everyone else is already taken.", category: "Inspiration" },
  { text: "The journey of a thousand miles begins with one step.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

// Load from local storage if available
const storedQuotes = localStorage.getItem("quotes");
if (storedQuotes) {
  quotes = JSON.parse(storedQuotes);
}

// Function to save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Function to show a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  const displayDiv = document.getElementById("quoteDisplay");
  displayDiv.textContent = "${randomQuote.text}" — ${randomQuote.category};

  // Save the last viewed quote in session storage
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));

  // Clear the quote after 10 seconds (10000 milliseconds)
  setTimeout(() => {
    displayDiv.textContent = "";
  }, 10000);
}

// Populate category dropdown (excluding "All Categories")
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");

  // Remove all options except the first one
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))].sort();

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  const lastFilter = localStorage.getItem("lastSelectedCategory");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
  } else {
    categoryFilter.value = "all";
  }
}

// Filter quotes by category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastSelectedCategory", selectedCategory);

  const displayDiv = document.getElementById("quoteDisplay");
  displayDiv.innerHTML = "";

  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    displayDiv.textContent = "No quotes in this category.";
  } else {
    filteredQuotes.forEach(q => {
      const p = document.createElement("p");
      p.textContent = "${q.text}" — ${q.category};
      displayDiv.appendChild(p);
    });
  }
}

// Function to create the add quote form
function createAddQuoteForm() {
  const form = document.createElement("form");

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.placeholder = "Enter quote text";
  textInput.required = true;

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter category";
  categoryInput.required = true;

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Add Quote";

  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(submitButton);

  const formContainer = document.getElementById("formContainer");
  formContainer.innerHTML = "";
  formContainer.appendChild(form);

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    const newQuote = {
      text: textInput.value,
      category: categoryInput.value
    };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    textInput.value = "";
    categoryInput.value = "";
    alert("Quote added!");
  });
}

// Function to export quotes as JSON
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

// Function to import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Fetch quotes from the server (GET)
async function fetchQuotesFromServer() {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "Fetching quotes from server...";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const serverData = await response.json();

    let newQuotesCount = 0;
    serverData.forEach(serverQuote => {
      const serverQuoteFormatted = {
        text: serverQuote.title,
        category: serverQuote.body
      };

      const existingIndex = quotes.findIndex(q => q.text === serverQuoteFormatted.text);
      if (existingIndex >= 0) {
        quotes[existingIndex] = serverQuoteFormatted;
      } else {
        quotes.push(serverQuoteFormatted);
        newQuotesCount++;
      }
    });

    saveQuotes();
    populateCategories();

    statusDiv.textContent = Sync complete: ${newQuotesCount} new quotes added/updated.;
  } catch (error) {
    console.error("Error fetching:", error);
    statusDiv.textContent = "Sync failed. Check your connection.";
  }
}

// Post quotes to the server (POST)
async function postQuotesToServer() {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "Posting quotes to server...";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quotes)
    });

    const responseData = await response.json();
    console.log("Server response to POST:", responseData);

    statusDiv.textContent = "Quotes successfully posted to server.";
  } catch (error) {
    console.error("Error posting:", error);
    statusDiv.textContent = "Failed to post quotes.";
  }
}

async function syncQuotes() {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "Syncing quotes...";

  await fetchQuotesFromServer();
  await postQuotesToServer();

  statusDiv.textContent = "Quotes synced with server!";
}

// On page load
window.onload = function() {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("createFormBtn").addEventListener("click", createAddQuoteForm);
  document.getElementById("exportBtn").addEventListener("click", exportQuotes);
  document.getElementById("importFile").addEventListener("change", importFromJsonFile);
  document.getElementById("categoryFilter").addEventListener("change", filterQuotes);
  document.getElementById("syncBtn").addEventListener("click", syncQuotes);
  document.getElementById("postBtn").addEventListener("click", postQuotesToServer);

  populateCategories();

  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote && document.getElementById("categoryFilter").value === "all") {
    const parsedQuote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").textContent = "${parsedQuote.text}" — ${parsedQuote.category};
  }

  setInterval(syncQuotes, 30000);
};