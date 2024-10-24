const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

const translateMessage = async (text, targetLang) => {
    const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;

    const body = JSON.stringify([{ Text: text }]);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": process.env.TRANSLATOR_SUBSCRIPTION_KEY, // Use environment variable
                "Ocp-Apim-Subscription-Region": process.env.TRANSLATOR_REGION, // Use environment variable
                "Content-Type": "application/json",
            },
            body,
        });

        if (!response.ok) {
            const errorData = await response.json(); // Log detailed error response
            console.error("Translation API error:", errorData);
            throw new Error("Translation failed");
        }

        const data = await response.json();
        return data[0].translations[0].text; // Extract translated text
    } catch (error) {
        console.error("Error translating message:", error);
        return text; // Return original text on error
    }
};

module.exports = translateMessage; // Export the function
