'use strict';

const helper = require('./contractHelper');

/**
 * This is a Node.JS module to invoke "registerCompany" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the registerCompany chaincode method
 */
async function registerCompany(orgType, reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const registerCompanyBuffer = await contractInstance.submitTransaction('registerCompany', reqPayload.companyCRN, reqPayload.companyName, reqPayload.location, reqPayload.organisationRole);
		let newCompany = JSON.parse(registerCompanyBuffer.toString());
		console.log('\n\n.....registerCompany invocation Complete!',newCompany);
        return newCompany;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking registerCompany : ${error.message}`);
	} finally {
		helper.disconnect();
		
	}
}
/**
 * This is a Node.JS module to invoke "addDrug" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the addDrug chaincode method.
 */
async function addDrug(orgType, reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const addDrugBuffer = await contractInstance.submitTransaction('addDrug', reqPayload.drugName, reqPayload.serialNo, reqPayload.mfgDate, reqPayload.expDate, reqPayload.companyCRN);
		let newDrug = JSON.parse(addDrugBuffer.toString());
		console.log('\n\n.....addDrug invocation Complete!',newDrug);
        return newDrug;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking addDrug : ${error.message}`);
	} finally {
		helper.disconnect();
		
	}
}
/**
 * This is a Node.JS module to invoke "viewDrugCurrentState" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the viewDrugCurrentState chaincode method.
 */
async function viewDrugCurrentState(orgType, reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const viewDrugCurrentStateBuffer = await contractInstance.submitTransaction('viewDrugCurrentState', reqPayload.drugName, reqPayload.serialNo);
		let drugState = JSON.parse(viewDrugCurrentStateBuffer.toString());
		console.log('\n\n.....viewDrugCurrentState invocation Complete!',drugState);
        return drugState;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking viewDrugCurrentState : ${error.message}`);
	} finally {
		helper.disconnect();
		
	}
}
/**
 * This is a Node.JS module to invoke "viewHistory" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the viewHistory chaincode method.
 */
async function viewHistory(orgType, reqPayload) {
	
	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const viewHistoryBuffer = await contractInstance.submitTransaction('viewHistory', reqPayload.drugName, reqPayload.serialNo);
		let drugState = JSON.parse(viewHistoryBuffer.toString());
		console.log('\n\n.....viewHistory invocation Complete!',drugState);
        return drugState;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking viewHistory : ${error.message}`);
	} finally {
		helper.disconnect();
	}
}
/**
 * This is a Node.JS module to invoke "createPO" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the createPO chaincode method.
 */
async function createPO(orgType, reqPayload) {

	try {
		const contractInstance = await helper.getContractInstance(orgType);
		console.log("contractInstance",contractInstance);
		const createPOBuffer = await contractInstance.submitTransaction('createPO', reqPayload.buyerCRN, reqPayload.sellerCRN, reqPayload.drugName, reqPayload.quantity);
		let poObject = JSON.parse(createPOBuffer.toString());
		console.log('\n\n.....createPO invocation Complete!',poObject);
        return poObject;
    } catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking createPO : ${error.message}`);
	} finally {
		helper.disconnect();
	}
}
/**
 * This is a Node.JS module to invoke "createShipment" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the createShipment chaincode method.
 */
async function createShipment(orgType, reqPayload) {

	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const createShipmentBuffer = await contractInstance.submitTransaction('createShipment', reqPayload.buyerCRN, reqPayload.drugName, reqPayload.listOfAssets, reqPayload.transporterCRN);
		let shipmentObject = JSON.parse(createShipmentBuffer.toString());
		console.log('\n\n.....createShipment invocation Complete!',shipmentObject);
		return shipmentObject;
	} catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking createShipment : ${error.message}`);
	} finally {
		helper.disconnect();
	}
}
/**
 * This is a Node.JS module to invoke "updateShipment" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the updateShipment chaincode method.
 */
async function updateShipment(orgType, reqPayload) {

	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const updateShipmentBuffer = await contractInstance.submitTransaction('updateShipment', reqPayload.buyerCRN, reqPayload.drugName, reqPayload.transporterCRN);
		let shipmentObject = JSON.parse(updateShipmentBuffer.toString());
		console.log('\n\n.....updateShipment invocation Complete!',shipmentObject);
		return shipmentObject;
	} catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking updateShipment : ${error.message}`);
	} finally {
		helper.disconnect();
	}
}
/**
 * This is a Node.JS module to invoke "retailDrug" method on chaincode.
 * 
 * @param orgType -  Name of the organisation. Based on this value, respective ADMIN's identity will be used to invoke the function.
 * @param reqPayload -  JSON Object containing all the required values of respective function to be invoked.
 * 
 * @returns  response of the retailDrug chaincode method.
 */
async function retailDrug(orgType, reqPayload) {

	try {
		const contractInstance = await helper.getContractInstance(orgType);
		const retailDrugBuffer = await contractInstance.submitTransaction('retailDrug', reqPayload.drugName, reqPayload.serialNo, reqPayload.retailerCRN, reqPayload.customerAadhar);
		let retailedDrugState = JSON.parse(retailDrugBuffer.toString());
		console.log('\n\n.....retailDrug invocation Complete!',retailedDrugState);
		return retailedDrugState;
	} catch (error) {
		console.log(`\n\n ${error} \n\n`);
		throw new Error(`Error while invoking retailDrug : ${error.message}`);
	} finally {
		helper.disconnect();
	}
}	

exports.registerCompany = registerCompany;
exports.addDrug = addDrug;
exports.viewDrugCurrentState = viewDrugCurrentState;
exports.viewHistory = viewHistory;
exports.createPO = createPO;
exports.createShipment = createShipment;
exports.updateShipment = updateShipment;
exports.retailDrug = retailDrug;
