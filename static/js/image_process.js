const openModalButton = document.getElementById('open-history-modal');
const closeModalButton = document.getElementById('close-history-modal');
const historyModal = document.getElementById('history-modal');

openModalButton.addEventListener('click', () => {
    historyModal.classList.remove('hidden');
    loadHistory();
});

closeModalButton.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

document.getElementById('dropzone-file').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        showProcessingBox("Processing your image...");

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            const imagePath = await saveImage(file);

            const predictionText = `${result.category} (${Math.min(result.confidence, 100).toFixed(2)}%)`;
            updateHistory(predictionText, result.image_url || "placeholder.png");

            showResultBox(result);
        } catch (error) {
            console.error('Error:', error);
            showResultBox({ message: "Something went wrong while processing your image.", confidence: 0 });
        }

        event.target.value = null;
    }
});

function showProcessingBox(message) {
    const dropBox = document.querySelector('.dropbox-container');
    dropBox.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50">
            <p class="text-base text-gray-500">${message}</p>
        </div>
    `;
}

function showResultBox(result) {
    const dropBox = document.querySelector('.dropbox-container');
    dropBox.innerHTML = `
        <div class="flex flex-col justify-center items-center border-2 border-gray-300 rounded-lg bg-gray-50 py-6 px-4">
            <div class="flex flex-col items-center text-center w-full">
                <p class="text-lg font-semibold text-gray-700 mb-4">This item is ${result.category}.</p>
                <div class="w-full bg-gray-200 rounded-lg mb-4">
                    <div class="bg-green-600 text-xs font-medium text-white flex items-center justify-center rounded-lg" style="width: ${Math.min(result.confidence, 100).toFixed(2)}%; height: 40px;">
                        ${Math.min(result.confidence, 100).toFixed(2)}%
                    </div>
                </div>
                <p class="text-sm text-gray-500 mb-6">
                    This item is identified as <b>${result.item}</b>. ${result.explanation}
                </p>
            </div>
            <div class="flex justify-center items-center w-full max-h-48">
                <img src="${result.image_url}" alt="${result.item}" class="rounded-lg shadow-md object-contain max-h-48 max-w-full">
            </div>
            <div class="flex justify-center space-x-4 mt-6">
                <button id="back-button" class="py-2 px-4 bg-gray-900 text-white rounded-lg">Back</button>
                <button id="dispose-button" class="py-2 px-4 bg-gray-900 text-white rounded-lg">How to Dispose?</button>
            </div>
        </div>
        <br>
        <br>
    `;

    document.getElementById('dispose-button').addEventListener('click', async () => {
        const disposeModal = document.getElementById('dispose-modal');
        const disposeContent = document.getElementById('dispose-content');

        disposeModal.classList.remove('hidden');

        try {
            const response = await fetch('https://jamsapi.hackclub.dev/openai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: `Give me 3-4 sentences on how to dispose ${result.category}.`
                        }
                    ]
                })
            });

            const data = await response.json();
            disposeContent.innerText = data.choices[0].message.content;
        } catch (error) {
            console.error('Error fetching disposal instructions:', error);
            disposeContent.innerText = 'Unable to fetch disposal instructions. Please try again later.';
        }
    });

    document.getElementById('back-button').addEventListener('click', resetDropBox);
}

document.getElementById('close-dispose-modal').addEventListener('click', () => {
    document.getElementById('dispose-modal').classList.add('hidden');
});

function resetDropBox() {
    location.reload();
}

function updateHistory(prediction, imageUrl) {
    const historyList = document.getElementById('history-list');
    const newItem = document.createElement('li');
    newItem.className = "flex items-center space-x-4";

    newItem.innerHTML = `
        <img src="${imageUrl}" alt="Uploaded Image" class="w-12 h-12 rounded-lg shadow-md">
        <span class="text-gray-700">${prediction}</span>
    `;

    if (historyList.querySelector('li').innerText === 'None') {
        historyList.innerHTML = '';
    }
    historyList.appendChild(newItem);

    const history = JSON.parse(localStorage.getItem('history')) || [];
    history.push({ prediction, imageUrl });
    localStorage.setItem('history', JSON.stringify(history));
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('history')) || [];

    if (history.length === 0) {
        historyList.innerHTML = '<li class="text-gray-500">None</li>';
    } else {
        historyList.innerHTML = '';
        history.forEach(item => {
            const newItem = document.createElement('li');
            newItem.className = "flex items-center space-x-4";
            newItem.innerHTML = `
                <img src="${item.imageUrl}" alt="Uploaded Image" class="w-12 h-12 rounded-lg shadow-md">
                <span class="text-gray-700">${item.prediction}</span>
            `;
            historyList.appendChild(newItem);
        });
    }
}

async function saveImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/save_image', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        console.error('Failed to save image.');
        return null;
    }

    const data = await response.json();
    return data.path || null;
}

document.getElementById('clear-history').addEventListener('click', () => {
    localStorage.removeItem('history');
    loadHistory();
});

window.onload = loadHistory;
