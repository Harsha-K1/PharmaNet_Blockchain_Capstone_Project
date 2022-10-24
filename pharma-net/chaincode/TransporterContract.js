'use strict';

const {Contract} = require('fabric-contract-api');
const sharedFunctions = require('./SharedFunctions.js');

class TransporterContract extends Contract {

	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.pharma-network.pharmanet.transporter');
	}
	
	// This is a basic user defined function used at the time of instantiating the smart contract to print the success message on console
	async instantiate(ctx) {
		console.log('PharmaNet - Transporter Smart Contract Instantiated');
		return 'PharmaNet - Transporter Smart Contract Instantiated';
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
     * @returns  A Transporter Company asset created on the ledger
     */
	async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {
		return await sharedFunctions.registerCompany(ctx, companyCRN, companyName, location, organisationRole);
	}

	//============================================================================================================================================
    /**
     * Use Case: This transaction is used to update the status of the shipment to ‘Delivered’ when the consignment gets delivered to the destination.
     * Validations: This function should be invoked only by the transporter of the shipment.
     * 
     * @param buyerCRN -  CRN of the Buyer Company
     * @param drugName -  Name of the drug being shipped
     * @param transporterCRN - CRN of the Transporter Company
     * 
     * @returns  Shipment asset updated on the ledger
     */
	async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {

		// Validation to allow ONLY ‘Transporter’ to perform this operation
	if(ctx.clientIdentity.mspId != 'transporterMSP'){
		throw new Error('Only a Trasnporter entity can perform this operation! Your Id : '+ctx.clientIdentity.mspId);
	}

	//Validation to check the buyer exists.
	let buyerCompanyQueryResult = await sharedFunctions.lookUpCompanyWithCRN(ctx, buyerCRN);
	if(buyerCompanyQueryResult.length == 0){
		throw new Error('No Buyer company exists with given CRN!');
	}

	//Validation to check the transporter exists.
	let transporterCompanyQueryResult = await sharedFunctions.lookUpCompanyWithCRN(ctx, transporterCRN);
	if(transporterCompanyQueryResult.length == 0){
		throw new Error('No Transporter company exists with given CRN!');
	}

	//Creation of composite key for the Shipment Order
	const shipmentID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.shipment', [buyerCRN, drugName]);
	let shipmentDataBuffer = await ctx.stub.getState(shipmentID).catch(err => console.log(err));
	if (!shipmentDataBuffer.toString()) {
		throw new Error('Cannot find any Shipment order with given Drug and Buyer info!');
	}
	const shipmentObject = sharedFunctions.convertToJson(shipmentDataBuffer);

	//validation to ensure the updateShipment & createShipment transporter CRNs are the same.
	if(shipmentObject.transporterCRN != transporterCRN){
		throw new Error('Transporter CRN given does not match with this shipment!');
	}

	var updateShipmentResp = [];

	//Update Shipment with given values.
	for(let i = 0; i < shipmentObject.assets.length; i++){
		const drugObjectDataBuffer = await ctx.stub.getState(shipmentObject.assets[i]).catch(err => console.log(err));
		let drugObject = sharedFunctions.convertToJson(drugObjectDataBuffer);
		drugObject.owner = buyerCompanyQueryResult[0].companyID;
		drugObject.shipment.push(shipmentID);
		console.log(">>> updateShipment drugObject = ",drugObject);
		updateShipmentResp.push(drugObject);
		await ctx.stub.putState(drugObject.productID, sharedFunctions.convertToBuffer(drugObject));
	}
	
	//Update status and push to blockchain.
	shipmentObject.status = 'DELIVERED';
	await ctx.stub.putState(shipmentID, sharedFunctions.convertToBuffer(shipmentObject));

	return shipmentObject;
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

module.exports = TransporterContract;