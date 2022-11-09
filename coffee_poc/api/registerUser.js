/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");
const { enroll } = require("./enrollAdmin");

const registerUser = {};

registerUser.registerEnrollUser = async (usr, org) => {
  try {
    // load the network configuration
    const ccpPath =
      "/home/ubuntu/pankajb/hyperledger/coffee_poc/api/connection-profiles/mfc-prd-config.json";
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new CA client for interacting with the CA.
    let caURL;
    if (org == "tata") {
      caURL = ccp.certificateAuthorities["ca.manufacturer.com"].url;
    } else if (org == "teafarm") {
      caURL = ccp.certificateAuthorities["ca.production.com"].url;
    } else if (org == "wharehouse") {
    } else if (org == "retailer") {
    }
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    let walletPath;
    if (org == "tata") {
      walletPath = path.join(process.cwd(), "tata-wallet");
    } else if (org == "teafarm") {
      walletPath = path.join(process.cwd(), "teafarm-wallet");
    } else if (org == "wharehouse") {
      walletPath = path.join(process.cwd(), "wharehouse-wallet");
    } else if (org == "retailer") {
      walletPath = path.join(process.cwd(), "retailer-wallet");
    }
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userIdentity = await wallet.get(usr);
    if (userIdentity) {
      console.log(
        'An identity for the user "appUser" already exists in the wallet'
      );
      return;
    }

    // Check to see if we've already enrolled the admin user.
    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      console.log(
        'An identity for the admin user "admin" does not exist in the wallet'
      );
      console.log("Run the enrollAdmin.js application before retrying");
      return;
    }

    // build a user object for authenticating with the CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);

    // console.log("\n====== provider ===== \n", provider);

    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    // console.log("\n====== Admin User ===== \n", adminUser);

    // Register the user, enroll the user, and import the new identity into the wallet.
    const secret = await ca.register(
      {
        affiliation: "tata.department1",
        enrollmentID: usr,
        role: "client",
      },
      adminUser
    );

    console.log("====== Secret ===== \n", secret);

    const enrollment = await ca.enroll({
      enrollmentID: usr,
      enrollmentSecret: secret,
    });

    console.log("\n====== Enrollment ===== \n", enrollment);

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "tataMSP",
      type: "X.509",
    };
    console.log("\n====== x509Identity ===== \n", x509Identity);

    await wallet.put(usr, x509Identity);
    console.log(
      "Successfully registered and enrolled admin user" +
        `${usr}` +
        " and imported it into the wallet"
    );
  } catch (error) {
    console.error("Failed to register user " + `${usr}` + " : " + `${error}`);
    process.exit(1);
  }
};

module.exports = registerUser;
