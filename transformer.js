const xmlbuilder = require("xmlbuilder");

const transformCaribouToISM = (caribouItem) => {
  const ismDetail = {
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
          TransactionCount: 1,
        },
      },
    },
    SalesMovementHeader: {
      CashierID: caribouItem.CashierID || "Cashier123",
    },
  };

  return ismDetail;
};

const initializeISMRoot = () => {
  return xmlbuilder.create({
    "NAXML-MovementReport": {
      "@xmlns": "http://www.naxml.org/POSBO/Vocabulary/2003-10-16",
      TransmissionHeader: {
        StoreLocationID: "Store123",
        VendorName: "VendorABC",
        VendorModelVersion: "1.0.0",
      },
      MovementHeader: {
        ReportSequenceNumber: 12345,
        PrimaryReportPeriod: "Monthly",
        BeginDate: "2024-01-01",
        BeginTime: "08:00:00",
        EndDate: "2024-01-31",
        EndTime: "17:00:00",
      },
      ItemSalesMovement: [],
    },
  });
};

module.exports = { transformCaribouToISM, initializeISMRoot };
