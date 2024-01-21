const express = require("express");
const fs = require("fs");
const xmlFlow = require("xml-flow");
const xmlbuilder = require("xmlbuilder");
const fileUpload = require("express-fileupload");
const util = require("util");

const app = express();
app.use(fileUpload());

// Utility to log errors along with a timestamp
const logError = (message, error) => {
  console.error(
    `[${new Date().toISOString()}] ${message}`,
    util.inspect(error, { depth: null })
  );
};

// Transform function - mapping Caribou fields to ISM structure
function transformCaribouToISM(caribouItem) {
  // Extracting and transforming fields from the Caribou item to match the ISM structure.
  const ismDetail = {
    TransmissionHeader: {
      StoreLocationID: "Store123", // Placeholder or derived from configuration
      VendorName: "VendorABC", // Placeholder or derived from configuration
      VendorModelVersion: "1.0.0", // Placeholder or derived from configuration
    },
    MovementHeader: {
      ReportSequenceNumber: 12345, // Placeholder or derived from a sequence generator
      PrimaryReportPeriod: "Monthly", // Placeholder or derived from business logic
      BeginDate: "2024-01-01", // Placeholder or derived from Caribou data
      BeginTime: "08:00:00", // Placeholder or derived from Caribou data
      EndDate: "2024-01-31", // Placeholder or derived from Caribou data
      EndTime: "17:00:00", // Placeholder or derived from Caribou data
    },
    ISMDetail: {
      ItemCode: {
        POSCodeFormat: caribouItem.POSCodeFormat || "defaultFormat",
        POSCode: caribouItem.INV_NUMBER || "defaultCode",
        POSCodeModifier: caribouItem.POSCodeModifier || "defaultModifier",
      },
      ItemID: caribouItem.SEQ_MAIN || "defaultItemID",
      Description:
        caribouItem.SomeDescriptionField || "No description available",
      MerchandiseCode: caribouItem.MerchandiseCode || "DefaultMerchCode",
      SellingUnits: caribouItem.SellingUnits || 1,
      ISMSellPriceSummary: {
        ActualSalesPrice: caribouItem.REALPRICE || 0,
        ISMSalesTotals: {
          SalesQuantity: caribouItem.MULTIPLIER || 1,
          SalesAmount:
            (caribouItem.REALPRICE || 0) * (caribouItem.MULTIPLIER || 1),
          TransactionCount: 1, // Placeholder or logic to count transactions
        },
      },
    },
    SalesMovementHeader: {
      CashierID: caribouItem.CashierID || "Cashier123", // Placeholder or mapped from Caribou data
      // ... Other fields if required by ISM
    },
    // ... Add any additional fields required by the ISM structure
  };

  return ismDetail;
}

app.post("/convert", (req, res) => {
  if (!req.files || !req.files.caribouFile) {
    const message = "No file was uploaded.";
    logError(message);
    return res.status(400).send(message);
  }

  const caribouFile = req.files.caribouFile;
  const caribouFileStream = fs.createReadStream(caribouFile.tempFilePath);
  const xmlStream = xmlFlow(caribouFileStream);

  // Initialize the ISM XML structure
  const ismRoot = xmlbuilder.create({
    "NAXML-MovementReport": {
      "@xmlns": "http://www.naxml.org/POSBO/Vocabulary/2003-10-16",
      TransmissionHeader: {}, // Placeholder, adjust with actual initialization
      ItemSalesMovement: [], // Initialize as an array to hold multiple ISMDetail elements
    },
  });

  // Process each Mainitem in the Caribou file
  xmlStream.on("tag:Mainitem", (caribouItem) => {
    try {
      const ismDetail = transformCaribouToISM(caribouItem);
      ismRoot
        .ele("NAXML-MovementReport")
        .ele("ItemSalesMovement")
        .push(ismDetail);
    } catch (error) {
      logError("Error transforming Caribou item to ISM detail:", error);
      // Optionally, you can stop processing and return an error response
    }
  });

  xmlStream.on("end", () => {
    try {
      const ismXmlString = ismRoot.end({ pretty: true });
      res.type("application/xml");
      res.send(ismXmlString);
    } catch (error) {
      const message = "Error building final ISM XML:";
      logError(message, error);
      res.status(500).send(message);
    }
  });

  xmlStream.on("error", (error) => {
    const message = "Error processing XML:";
    logError(message, error);
    res.status(500).send(message);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
