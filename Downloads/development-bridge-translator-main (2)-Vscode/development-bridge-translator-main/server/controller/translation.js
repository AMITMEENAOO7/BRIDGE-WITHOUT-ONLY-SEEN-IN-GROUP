const fetch = require('node-fetch'); // Ensure node-fetch is installed

const translateText = async (req, res) => {
    const { text, targetLang } = req.body;

    const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;
    const body = JSON.stringify([{ Text: text }]);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": f14a3a47b0cc403aa31da18f496d4e48,
                "Ocp-Apim-Subscription-Region": southeastasia,
                "Content-Type": "application/json",
            },
            body,
        });

        if (!response.ok) {
            throw new Error("Translation failed");
        }

        const data = await response.json();
        const translatedText = data[0].translations[0].text; // Extract translated text

        res.json({ translatedText });
    } catch (error) {
        console.error("Error translating message:", error);
        res.status(500).json({ message: "Error translating message", error });
    }
};

module.exports = { translateText };
