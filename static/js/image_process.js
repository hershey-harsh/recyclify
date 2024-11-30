document.getElementById('dropzone-file').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        // Remove drop box and show a loading message while processing
        showProcessingBox("Processing your image...");

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            // Replace the drop box with the result box
            showResultBox(result);
        } catch (error) {
            console.error('Error:', error);
            showResultBox({message: "Something went wrong while processing your image.", confidence: 0});
        }

        // Clear the file input
        event.target.value = null;
    }
});

function showProcessingBox(message) {
    const dropBox = document.querySelector('.dropbox-container');
    dropBox.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700">
            <p class="text-base text-gray-500 dark:text-gray-400">${message}</p>
        </div>
    `;
}

function showResultBox(result) {
    const dropBox = document.querySelector('.dropbox-container');

    dropBox.innerHTML = `
        <div class="grid grid-cols-2 gap-4 border-2 border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 pt-16 px-4 h-64">
            <!-- Text section 1 -->
            <div class="pl-8 flex flex-col items-start justify-start">
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">This item is ${result.category}.</p>
                <div class="w-full bg-gray-200 rounded-lg dark:bg-gray-600 mb-2">
                    <div class="bg-green-600 text-xs font-medium text-white flex items-center justify-center rounded-lg" style="width: ${Math.min(result.confidence, 100).toFixed(2)}%; height: 40px;"> 
                        ${Math.min(result.confidence, 100).toFixed(2)}% 
                    </div>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">This item is identified as <b>${result.item}</b>. Please make sure to handle it appropriately.</p>
            </div>

            <!-- Text section 2 -->
            <div class="pl-8 flex flex-col items-start justify-start">
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Why is this item a ${result.category}?</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${result.explanation}</p>
            </div>
        </div>

        <button id="back-button" class="mt-4 py-2 px-4 bg-gray-900 text-white rounded-lg">Back</button>
    `;

    document.getElementById('back-button').addEventListener('click', resetDropBox);
}
// width: ${Math.min(result.confidence, 100).toFixed(2)}%;
function resetDropBox() {
    location.reload();
}