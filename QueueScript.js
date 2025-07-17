const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const { getOrchestratorAccessToken } = require('./services/Orchestrator');

function readQuotationCSV() {
    return new Promise((resolve, reject) => {
        const results = [];
        
        fs.createReadStream('Quotations.csv')
            .pipe(csv())
            .on('data', (row) => {
                results.push({
                    SalesDocument: row['Sales document'],
                    CustomerReference: row['Customer Reference'],
                    SoldToParty: row['Sold-To Party'],
                    QuotationValidFrom: row['Quotation Valid From'],
                    QuotationValidTo: row['Quotation Valid To']
                });
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function addQueueTransactions() {
    try {
        // Step 1: Read CSV data
        const csvData = await readQuotationCSV();
        console.log(`Read ${csvData.length} records from CSV`);

        // Step 2: Get access token
        const accessToken = await getOrchestratorAccessToken();
        console.log('Got access token');

        // Step 3: Loop through CSV data and make API calls
        const results = [];
        for (const item of csvData) {
            try {
                const response = await axios.post(
                    'https://cloud.uipath.com/panw/Dev/orchestrator_/odata/Queues/UiPathODataSvc.AddQueueItem',
                    {
                        itemData: {
                            Name: "PO_1",
                            Priority: "High",
                            SpecificContent: {
                                "QuotationNumber": "00"+item.SalesDocument,
                                "PONumber": item.CustomerReference,
                                "Sold-To": item.SoldToParty,
                                "Created on from": item.QuotationValidFrom,
                                "Created on To": item.QuotationValidTo
                            },
                            DeferDate: null,
                            DueDate: null,
                            Reference: "00"+item.SalesDocument,
                            ParentOperationId: "string"
                        }
                    },
                    {
                        headers: {
                            'accept': 'application/json',
                            'X-UIPATH-OrganizationUnitId': '1050247',
                            'Content-Type': 'application/json;odata.metadata=minimal;odata.streaming=true',
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                console.log(`Successfully added queue item for ${item.SalesDocument}`);
                results.push({ success: true, item, response: response.data });

            } catch (error) {
                console.error(`Failed to add queue item for ${item.SalesDocument}:`, error.message);
                results.push({ success: false, item, error: error.message });
            }
        }

        return results;

    } catch (error) {
        console.error('Error in addQueueTransactions:', error);
        throw error;
    }
}

addQueueTransactions()

module.exports = { 
    readQuotationCSV, 
    addQueueTransactions 
};
