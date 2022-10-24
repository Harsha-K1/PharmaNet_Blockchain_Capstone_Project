'use strict';

const {Contract} = require('fabric-contract-api');
const sharedFunctions = require('./SharedFunctions.js');

class ManufacturerContract extends Contract {

	constructor() {
		//Provide a (preferably fully qualified) custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.manufacturer');
	}
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Manufacturer Smart Contract Instantiated');
		return 'PharmaNet - Manufacturer Smart Contract Instantiated';
	}
	
    //============================================================================================================================================
    /**
     * Use Case: This transaction/function will be used to register new entities on the ledger. 
     * For example, for “VG pharma” to become a distributor on the network, it must register itself on the ledger using this transaction.
     * 
     * 
     * @param companyCRN -  Unique CRN of the company
     * @param companyName - Name of the company
     * @param location -  Location of the company
     * @param organisationRole - Role of the company in the network
     * 
     * @returns  A Manufacturer Company asset created on the ledger
     */
        async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {
            return await sharedFunctions.registerCompany(ctx, companyCRN, companyName, location, organisationRole);
        }

    //============================================================================================================================================
    /**
     * Use Case: This transaction is used by any organisation registered as a ‘manufacturer’ to register a new drug on the ledger. 
     * Validations: This transaction should be invoked only by a manufacturer registered on the ledger.
     * 
     * @param drugName -  Name of the drug
     * @param serialNo - Serial number of the drug
     * @param mfgDate -  Manufacturing date of the drug
     * @param expDate - Expiry date of the drug
     * @param companyCRN - Unique identification number of the Manufacturer
     * 
     * @returns  A Drug asset created on the ledger
     */
    async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {

        //Validation to check the caller is Manufacturer.
        if(ctx.clientIdentity.mspId != 'manufacturerMSP'){
            throw new Error('Only a Manufacturer entity can perform this operation!');
        }

        let companyQueryResult = await sharedFunctions.lookUpCompanyWithCRN(ctx, companyCRN);
        if(companyQueryResult.length == 0){
            throw new Error('No Manufacturer exists with given CRN!');
        }
        
        if(companyQueryResult[0].organisationRole != 'MANUFACTURER'){
            throw new Error('You are not registered as a Manufacturer, so cannot add drugs!');
        }
        
        let drugQueryResult = await sharedFunctions.lookUpDrugWithName(ctx, drugName);

        //Creation of a composite key for the new drug
        const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName, serialNo]);

        for (const drug of drugQueryResult){
            if(drug.productID === productID){
                throw new Error('A Drug with name: '+drugName+' & serialNo: '+serialNo+' already exists!');
            }
        }
        
        //Creation of the Drug data model.
        let newDrugObject = {
            productID: productID,
            name: drugName,
            serialNo:serialNo,
            manufacturer: companyQueryResult[0].companyID,
            manufacturingDate: mfgDate,
            expiryDate: expDate,
            owner: companyQueryResult[0].companyID,
            shipment : [] //Empty at this point. Will be populated at each step of drug transfer journey.
        };
        
        let dataBuffer = Buffer.from(JSON.stringify(newDrugObject));
        await ctx.stub.putState(productID, dataBuffer);

        return newDrugObject;
    }

    //============================================================================================================================================
    /**
     * Use Case: After the buyer invokes the createPO transaction, the seller invokes this transaction to transport the consignment via 
     * a transporter corresponding to each PO.
     * 
     * Validations: The length of ‘listOfAssets’ should be exactly equal to the quantity specified in the PO.
     * The IDs of the Asset should be valid IDs which are registered on the network.
     * 
     * @param buyerCRN -  CRN of the Buyer Company
     * @param drugName -  Name of the drug being shipped
     * @param listOfAssets - list of all drugs purchased
     * @param transporterCRN - CRN of the Transporter Company
     * 
     * @returns  A Shipment asset created on the ledger
     */
    async createShipment (ctx, buyerCRN, drugName, listOfAssets, transporterCRN ) {
        console.log("ManufacturerContract >>> createShipment : buyerCRN, drugName, listOfAssets, transporterCRN = ",buyerCRN, drugName, listOfAssets, transporterCRN );
        return await sharedFunctions.createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN );
    }


    //============================================================================================================================================
    /**
     * Use Case: This transaction is used to view the current state of the Asset.
     * 
     * @param drugName -  Name of the drug being shipped
     * @param serialNo - Serial number of the drug
     * 
     * @returns  Current state of the drug
     */
    async viewDrugCurrentState(ctx, drugName, serialNo) {
        return await sharedFunctions.viewDrugCurrentState(ctx, drugName, serialNo);
    }

    //============================================================================================================================================
    /**
     * Use Case: This transaction will be used to view the lifecycle of the product by fetching transactions from the blockchain. 
     * 
     * @param drugName -  Name of the drug being shipped
     * @param serialNo - Serial number of the drug
     * 
     * @returns  The transaction id along with the details of the asset for every transaction associated with it.
     */
    async viewHistory(ctx, drugName, serialNo) {
        return await sharedFunctions.viewHistory(ctx, drugName, serialNo);
    }

}

module.exports = ManufacturerContract;