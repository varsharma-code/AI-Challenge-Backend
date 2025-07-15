const { getOrchestratorAccessToken, getQueueItems } = require("../services/Orchestrator");

(async () => {
    try {
        const access_token = await getOrchestratorAccessToken();
        const quItems = await getQueueItems(access_token);
        console.log("QUItems",quItems)
        // Transform the data to only include relevant fields
        const filteredItems = quItems.map(item => ({
            Id: item.Id,
            Title: item.SpecificContent?.Title,
            ArticleContent: item.SpecificContent?.ArticleContent
        }));

        console.log("Filtered Queue Items:", filteredItems);
    } catch (error) {
        console.error("Error during initial fetch of queue items:", error);
    }
})();
