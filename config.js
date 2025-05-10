// Initial fallback configuration with NO actual WhatsApp link
const WHATSAPP_CONFIG = {
  // Don't include the actual link here - it will be fetched securely
  expiresDate: "2025-04-01",
  groupName: "Brooklyn Heights Run Club"
};

// Function to fetch data from Google Sheets securely
(function loadWhatsAppConfig() {
  // ⚠️ IMPORTANT: Replace this with your actual Sheet ID ⚠️
  const SHEET_ID = "18196gy2PxuUFuCn-Y1IJnkQUf-GUzACVPHWR_Hg8ikg";
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;

  // Only fetch the data after captcha is completed
  window.fetchWhatsAppLink = function() {
    console.log("Attempting to fetch WhatsApp link from Google Sheet...");
    console.log("Sheet URL:", SHEET_URL);

    return fetch(SHEET_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        console.log("Received response from Google Sheets");
        return response.text();
      })
      .then(data => {
        console.log("Raw data received length:", data.length);

        try {
          // Google's response is not pure JSON - it has a prefix we need to remove
          const jsonStart = data.indexOf('(');
          const jsonEnd = data.lastIndexOf(')');

          if (jsonStart === -1 || jsonEnd === -1) {
            console.error("Invalid data format from Google Sheets");
            throw new Error('Invalid data format from Google Sheets');
          }

          const jsonString = data.substring(jsonStart + 1, jsonEnd);
          console.log("Extracted JSON string length:", jsonString.length);

          const jsonData = JSON.parse(jsonString);
          console.log("Parsed JSON data structure:", Object.keys(jsonData));

          // Get the rows from the sheet
          if (!jsonData.table || !jsonData.table.rows) {
            console.error("No table or rows in the JSON data");
            throw new Error('No table data found in response');
          }

          const rows = jsonData.table.rows;
          console.log("Number of rows:", rows.length);

          // Get the last (most recent) row - this is your latest WhatsApp link
          if (rows.length > 0) {
            const lastRow = rows[rows.length - 1].c;
            console.log("Last row data structure:", lastRow ? "Found" : "Not found");

            if (!lastRow || !lastRow[1] || !lastRow[1].v) {
              console.error("WhatsApp link not found in the last row");
              throw new Error('WhatsApp link missing in data');
            }

            // Return the WhatsApp link and expiry date
            const result = {
              inviteLink: lastRow[1].v,
              expiresDate: null
            };

            if (lastRow[2] && lastRow[2].v) {
              // Format date if needed
              const dateValue = lastRow[2].v;
              console.log("Date value type:", typeof dateValue);

              // Try to parse various date formats
              let expiryDate;
              if (typeof dateValue === 'string') {
                // Try to parse the string date
                expiryDate = new Date(dateValue);
              } else if (dateValue && typeof dateValue === 'object' && dateValue.getFullYear) {
                // It's already a date object
                expiryDate = dateValue;
              } else if (typeof dateValue === 'number') {
                // It might be a timestamp
                expiryDate = new Date(dateValue);
              }

              // Only set the expiry date if we got a valid date
              if (expiryDate && !isNaN(expiryDate.getTime())) {
                result.expiresDate = expiryDate.toISOString().split('T')[0];
              }
            }

            console.log("Successfully retrieved WhatsApp link");
            return result;
          } else {
            console.error("No rows found in the sheet");
            throw new Error('No data found in sheet');
          }
        } catch (error) {
          console.error("Error parsing data:", error);
          throw error;
        }
      });
  };

  // Load initial config but NOT the WhatsApp link
  document.addEventListener('DOMContentLoaded', function() {
    // Update group name if provided
    if (WHATSAPP_CONFIG.groupName) {
      document.title = `Join ${WHATSAPP_CONFIG.groupName} on WhatsApp`;
    }
  });
})();
