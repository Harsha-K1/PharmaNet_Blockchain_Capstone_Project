'use strict';


const hierarchyKeyMap = { //As defined by Upgrad project spec.
	'Manufacturer' : 1,
	'Distributor' : 2,
	'Retailer' : 3
};


const organisationRoleMap = {
	'Manufacturer' : 'MANUFACTURER',
	'Distributor' : 'DISTRIBUTOR',
	'Retailer' : 'RETAILER',
	'Transporter' : 'TRANSPORTER'
};

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
 * @returns  A Company asset created on the ledger
 */

async function registerCompany(ctx, companyCRN, companyName, location, organisationRole) {

	//Validation to check the caller is either a Manufacturer or Distributor or Retailer  or Transporter.
	if(ctx.clientIdentity.mspId =='consumerMSP'){
		throw new Error('Only a Manufacturer or Distributor or Retailer entity can perform this operation! Your Id: '+ctx.clientIdentity.mspId);
	}

	//Validation to check the organisation role.
	if(!organisationRoleMap[organisationRole]){	
		throw new Error('Invalid Organisation Role: ' + organisationRole );
	}

	//Validation to check the possible existence of a company with same CRN
	let companyQueryResult = await lookUpCompanyWithCRN(ctx, companyCRN);
	if(companyQueryResult.length > 0){
		throw new Error('A company with given CRN already exists!');
	}
	
	//Creation of a composite key for the new company
	const companyID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.company', [companyCRN, companyName]);

	//Validation to check the possible existence of a company with same given details 
	let companyDataBuffer = await ctx.stub.getState(companyID).catch(err => console.log(err));
	if (companyDataBuffer.toString()) {
		throw new Error('A company with given CRN & name already exists!');
	}

	//Creation of the company data model
	let newCompanyObject = {
		companyID: companyID,
        name: companyName,
		location: location,
		organisationRole: organisationRoleMap[organisationRole],
		hierarchyKey : hierarchyKeyMap[organisationRole],
		createdBy: ctx.clientIdentity.getID(),
		createdDate: new Date()
	};

    //Transporter has no hierarchyKey - only for Manufacturer or Distributor or Retailer.
    if(ctx.clientIdentity.mspId !='transporterrMSP'){
		newCompanyObject.hierarchyKey = hierarchyKeyMap[organisationRole];
	}
    console.log(">>> registerCompany newCompanyObject = "+newCompanyObject);
    
	//Add company object to the blockchain
    let dataBuffer = convertToBuffer(newCompanyObject);
	await ctx.stub.putState(companyID, dataBuffer);

	return newCompanyObject;
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
async function createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {

	//Validation to check the caller is either Distributor or Retailer.
	if(ctx.clientIdentity.mspId != 'distributorMSP' && ctx.clientIdentity.mspId != 'retailerMSP'){
		throw new Error('Only a Distributor or a Retailer entity can perform this operation! Your Id: '+ctx.clientIdentity.mspId);
	}

	//Validation to check the buyer company exists.
	let buyerCompanyQueryResult = await lookUpCompanyWithCRN(ctx, buyerCRN);
	if(buyerCompanyQueryResult.length == 0){
		throw new Error('No Buyer company exists with given CRN!');
	}

    //Validation to check the buyer validity.
	const buyerCompanyInfo = buyerCompanyQueryResult[0];
	if(buyerCompanyInfo.hierarchyKey == 1){
		throw new Error('Buyer cannot be the Manufacturer!');
	}

	//Validation to check the seller company exists.
	let sellerCompanyQueryResult = await lookUpCompanyWithCRN(ctx, sellerCRN);
	if(sellerCompanyQueryResult.length == 0){
		throw new Error('No Seller company exists with given CRN!');
	}
	const sellerCompanyInfo = sellerCompanyQueryResult[0];

	//Validation to check the drug exists.
	let drugQueryResult = await lookUpDrugWithName(ctx, drugName);
	if(drugQueryResult.length == 0){
		throw new Error('No drug exists with given name: '+drugName);
	}
	//Validation to check the drug availability.
	let drugFoundWithSeller = false;

    for(const drug of drugQueryResult){
        if(drug.owner === sellerCompanyInfo.companyID){
            drugFoundWithSeller = true;
            break;
        }
    }

	if(!drugFoundWithSeller){
		throw new Error(`Drug ${drugName} not found with this Seller!`);
	}

	//Validation to ensure the transfer of drug takes place in a hierarchical manner.
	if(parseInt(sellerCompanyInfo.hierarchyKey) + 1 != parseInt(buyerCompanyInfo.hierarchyKey)){
		throw new Error('You cannot purchase directly from '+sellerCompanyInfo.organisationRole+ ' as you are a '+buyerCompanyInfo.organisationRole + '!');
	}

	//Creation of a composite key for the new PO.
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [buyerCRN, drugName]);
	console.log(">>> createPO poID = "+poID);

	//Creation of the PO data model
	let newPOObject = {
		poID: poID,
		drugName: drugName,
        buyer: buyerCompanyInfo.companyID,
        seller: sellerCompanyInfo.companyID,
        quantity: parseInt(quantity),
        otherInfo: {
            buyerName: buyerCompanyInfo.name,
		    sellerName: sellerCompanyInfo.name
        }
		
	};
	
	//Add PO object to the blockchain
	let dataBuffer = convertToBuffer(newPOObject);
	await ctx.stub.putState(poID, dataBuffer);
	
	return newPOObject;
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
async function createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN) {

	//Validation to check the caller is either Manufacturer or Distributor or Retailer.
	if(ctx.clientIdentity.mspId != 'manufacturerMSP' && ctx.clientIdentity.mspId != 'distributorMSP' && ctx.clientIdentity.mspId != 'retailerMSP'){
		throw new Error('Only a Manufacturer or Distributor or Retailer entity can perform this operation! Your Id: '+ctx.clientIdentity.mspId);
	}
	
	//Validation to check the buyer exists.
	let buyerCompanyQueryResult = await lookUpCompanyWithCRN(ctx, buyerCRN);
	if(buyerCompanyQueryResult.length == 0){
		throw new Error('No Buyer company exists with given CRN!');
	}

    //Validation to check the buyer validity.
    const buyerCompanyInfo = buyerCompanyQueryResult[0];
    if(buyerCompanyInfo.hierarchyKey == 1){
		throw new Error('Buyer cannot be the Manufacturer!');
	}

	//Validation to check the transporter exists.
	let transporterCompanyQueryResult = await lookUpCompanyWithCRN(ctx, transporterCRN);
	if(transporterCompanyQueryResult.length == 0){
		throw new Error('No Transporter company exists with given CRN!');
	}

	//Validation to check the PO exists for the drug by given Buyer.
	const poID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.po', [buyerCRN, drugName]);
	let poDataBuffer = await ctx.stub.getState(poID).catch(err => console.log(err));
	if (!poDataBuffer.toString()) {
		throw new Error('No PO exists for drug '+drugName+' by buyer '+buyerCRN+'!');
	}
	const poDetails = convertToJson(poDataBuffer);

	//Validation to ensure the length of ‘listOfAssets’ is exactly equal to the quantity specified in the PO.
	var listOfAssetsArray = listOfAssets.split(',');
	if(listOfAssetsArray.length != parseInt(poDetails.quantity)){
		throw new Error('The length of list of assets should be exactly equal to the quantity specified in the PO.');
	}

    //Validation to check the drug exists.
	let drugQueryResult = await lookUpDrugWithName(ctx, drugName);
	if(drugQueryResult.length == 0){
		throw new Error('No drug exists with given name: '+drugName);
	}
	
	//Validation to check drug exists with Manufacturer and is valid.
	let drugFoundWithSeller = false;
	let assetList = [];
	let i = 0;

    for(const drugMatchingPassedName of drugQueryResult){
        if(drugMatchingPassedName.owner === poDetails.seller){
            drugFoundWithSeller = true;
            if(listOfAssetsArray[i] == drugMatchingPassedName.serialNo){
				console.log(" >>> createShipment drug productID = ",drugMatchingPassedName.productID);
				assetList.push(drugMatchingPassedName.productID);
            }
            if(assetList.length == poDetails.quantity){
                break;
            }
        }
		i++;
    }
	//Validation of drug owensership with seller.
	if(!drugFoundWithSeller){
		throw new Error('This drug '+drugName+' is not owned by given seller!');
	}
	//Stock check
	if(assetList.length < poDetails.quantity){
		throw new Error(`No drug ${drugName} exists with given info. Please check the Drug info provided.`);
	}
	//Creation of a new composite key for the new Shipment.
	const shipmentID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.shipment', [buyerCRN, drugName]);

	//Creation of the Shipment data model.
	let newShipmentObject = {
		shipmentID: shipmentID,
		creator : poDetails.seller,
		assets : assetList,
		transporterCRN: transporterCRN,
		status: 'IN-TRANSIT'
	};
	
	//Add Shipment object to the blockchain.
	await ctx.stub.putState(shipmentID, convertToBuffer(newShipmentObject));
	
	return newShipmentObject;
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
async function viewHistory(ctx, drugName, serialNo) {

	//Fetch drug with given serialNo.
	const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName, serialNo]);
	let historyQueryIterator = await ctx.stub.getHistoryForKey(productID).catch(err => console.log(err));
	const historyValues = getAllResults(historyQueryIterator);
	return historyValues;
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
async function viewDrugCurrentState(ctx, drugName, serialNo) {

	//Validation to check if drug with given serialNo exists.
	const productID = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.drug', [drugName, serialNo]);
	let drugObjectDataBuffer = await ctx.stub.getState(productID).catch(err => console.log(err));
	if (!drugObjectDataBuffer.toString()) {
		throw new Error('No drug available with given Name & SerialNo : ',drugName, serialNo);
	}
	return convertToJson(drugObjectDataBuffer);
}
//============================================================================================================================================
//											Utility functions
//============================================================================================================================================

/**
 * Converts the data model object to a buffer stream
 * @param jsonObj -  object to be converted
 * @returns {Buffer}
 */
function convertToBuffer(jsonObj) {
	return Buffer.from(JSON.stringify(jsonObj));
}
//============================================================================================================================================
/**
 * Converts the buffer stream from blockchain into a data model object
 * @param buffer {Buffer}
 * @returns {Object}
 */
function convertToJson(buffer) {
	return JSON.parse(buffer.toString());
}
//============================================================================================================================================
/**
 * This is a utility function to get results from partialKey iterator.
 * 
 * @param {*} iterator :	Iterator of getStateByPartialCompositeKey
 * @returns  Results of the iterator processed.
 */
async function getAllResults(iterator) {
	const allResults = [];
	while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
			allResults.push(JSON.parse(res.value.value.toString('utf8')));
        }
        if (res.done) {
			await iterator.close();
            return allResults;
        }
    }
}
//============================================================================================================================================
async function getDrugkey(ctx, drugDetail){
	const resultIterator = await ctx.stub.getStateByPartialCompositeKey('org.pharma-network.pharmanet.drug', [drugDetail]);
	const resultItem = await resultIterator.next();
    return resultItem.value.key;
}
//============================================================================================================================================

//============================================================================================================================================
async function lookUpCompanyWithCRN(ctx, companyCRN){
	return await getAllResults(await ctx.stub.getStateByPartialCompositeKey('org.pharma-network.pharmanet.company', [companyCRN]));
	
}
//============================================================================================================================================
async function lookUpDrugWithName(ctx, drugName){
	return await getAllResults(await ctx.stub.getStateByPartialCompositeKey('org.pharma-network.pharmanet.drug', [drugName]));
	
}
//============================================================================================================================================

module.exports.createPO = createPO;
module.exports.viewHistory = viewHistory;
module.exports.createShipment = createShipment;
module.exports.registerCompany = registerCompany;
module.exports.viewDrugCurrentState = viewDrugCurrentState;
module.exports.convertToBuffer = convertToBuffer;
module.exports.convertToJson = convertToJson;
module.exports.lookUpDrugWithName = lookUpDrugWithName;
module.exports.lookUpCompanyWithCRN = lookUpCompanyWithCRN;