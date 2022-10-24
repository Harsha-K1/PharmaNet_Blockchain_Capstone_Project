'use strict';

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * 	User name would be <<ORG_NAME>>_ADMIN
 */

const fs = require('fs'); // FileSystem Library
const path = require('path'); // Support library to build filesystem paths in NodeJs
const { FileSystemWallet, X509WalletMixin } = require('fabric-network'); // Wallet Library provided by Fabric

const crypto_materials = path.resolve(__dirname, '../network/crypto-config'); // Directory where all Network artifacts are stored

// A wallet is a filesystem path that stores a collection of Identities
async function addIdentity(orgType, privateKeyFileName){
	try {
		const wallet = new FileSystemWallet('./identity/'+orgType+'');

		// Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
		const credentialPath = path.join(crypto_materials, '/peerOrganizations/'+orgType+'.pharma-network.com/users/Admin@'+orgType+'.pharma-network.com');
		const certificate = fs.readFileSync(path.join(credentialPath, '/msp/signcerts/Admin@'+orgType+'.pharma-network.com-cert.pem')).toString();

		// IMPORTANT: Change the private key name to the key generated on your computer
		const privatekey = fs.readFileSync(path.join(credentialPath, '/msp/keystore/'+privateKeyFileName)).toString();
		
		// Load credentials into wallet
		const identityLabel = orgType.toUpperCase()+'_ADMIN';
		const identity = X509WalletMixin.createIdentity(''+orgType+'MSP', certificate, privatekey);
		
		await wallet.import(identityLabel, identity);

		console.log(identityLabel +" identity added successfully");
		
	} catch (error) {
		console.log(error.stack);
		throw new Error(`Error adding to wallet. ${error}`);
	}
}

/**
 * This is a Node.JS module to load all user's Identity to their respective wallet.
 * This Identity will be used to sign transactions initiated by this user.
 */
async function addAllStakeholderIdentitities() {
	try {
		await addIdentity('manufacturer','8192b5a08398d271a84820964718fdf8c95fceac7d262a7e7dc38f98a95a87df_sk');
		await addIdentity('distributor','cc8847905b4af0d13aef601f06513494d9f1909489c4b09cbd1fdab2f8c638c5_sk');
		await addIdentity('retailer','9bd13b394e404125e8f4e77ee1489bc883a716a0a0656d8ec28f352b6f1ac456_sk');
		await addIdentity('consumer','4dbf36e520f90f2f176f6a2c4e6fcc4364476617d36c25eb81545b146ff5ea52_sk');
		await addIdentity('transporter','77ebfe602eec2a23084106130cfb0a91f090e9d5624790f8be385629cae26d36_sk');
	} catch (error) {
		console.log(error.stack);
		throw new Error(`Error adding to wallet. ${error}`);
	}
}

exports.addIdentity = addIdentity;
exports.addAllStakeholderIdentitities = addAllStakeholderIdentitities;
