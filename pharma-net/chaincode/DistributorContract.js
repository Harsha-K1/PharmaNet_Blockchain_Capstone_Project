'use strict';

const {Contract} = require('fabric-contract-api');
const sharedFunctions = require('./SharedFunctions.js');


class DistributorContract extends Contract {
	
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.distributor');
	}
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Distributor Smart Contract Instantiated');
		return 'PharmaNet -  Disributor Smart Contract Instantiated';
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
     * @returns  A Distributor Company asset created on the ledger
     */
	async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {
		return await sharedFunctions.registerCompany(ctx, companyCRN, companyName, location, organisationRole);
	}
	//============================================================================================================================================
    /**
     * Use Case: This function is used to create a Purchase Order (PO) to buy drugs, by companies belonging to ‘Distributor’ or ‘Retailer’ organisation.
     * 
     * Validations: You need to make sure that the transfer of drug takes place in a hierarchical manner and no organisation in the middle is skipped. 
     * For example, you need to make sure that a retailer is able to purchase drugs only from a distributor and not from a manufacturing company.
     * 
     * @param buyerCRN -  CRN of the Buyer Company
     * @param sellerCRN - CRN of the Seller Company
     * @param drugName -  Name of the drug purchased
     * @param quantity - Quanity of the drug purchased
     * 
     * @returns  A ‘PO’ asset created on the ledger
     */
	async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {
		return await sharedFunctions.createPO(ctx, buyerCRN, sellerCRN, drugName,quantity);
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
	async createShipment(ctx,buyerCRN, drugName, listOfAssets, transporterCRN ) {
		console.log("DistributorContract >>> createShipment : buyerCRN, drugName, listOfAssets, transporterCRN = ",buyerCRN, drugName, listOfAssets, transporterCRN );
		return await sharedFunctions.createShipment(ctx,buyerCRN, drugName, listOfAssets, transporterCRN );
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

module.exports = DistributorContract;