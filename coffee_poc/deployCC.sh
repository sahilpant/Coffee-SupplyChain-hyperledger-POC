VERSION="1"

mfdPrdCC(){
    echo "********** Packaging CC for Manufacture-Production-Channel ********************"
    # sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode package basic.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/mfc-prdc --lang node --label basic_1.0
    sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode package basic.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode --lang node --label basic_${VERSION}

    sleep 6

    # sudo docker exec -it cli-production-1 peer lifecycle chaincode package basic.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/mfc-prdc --lang node --label basic_1.0
    sudo docker exec -it cli-production-1 peer lifecycle chaincode package basic.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode --lang node --label basic_${VERSION}

    sleep 6

    echo "********** ChainCode Packaged for Manufacture-Production-Channel ********************"

    echo "********* Installing CC for Manufacture-Production-Channel ************ "
    sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/basic.tar.gz
    
    sleep 6
    
    sudo docker exec -it cli-production-1 peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/basic.tar.gz

    sleep 6
}

# mfdWhsCC(){

# }

# whsRtlrCC(){

# }


ApproveCCMfdPrd(){
  sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode queryinstalled >&log.txt
  cat log.txt
  CC_PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
#   export CC_PACKAGE_ID
 sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode approveformyorg -o orderer1.gov.io:7050 --channelID mfd-prd-channel --name basic --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence ${VERSION} --tls --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem"

 sleep 5

 sudo docker exec -it cli-production-1 peer lifecycle chaincode approveformyorg -o orderer1.gov.io:7050 --channelID mfd-prd-channel --name basic --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence ${VERSION} --tls --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem"

 sleep 5
}

# ApproveCCMfdWhs(){
    
# }

# ApproveCCWhsRtlr(){
    
# }

CheckCommitMfdPrd(){
echo "Checking Commit Readiness for Channel mfd-prd-channel"
    sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode checkcommitreadiness --channelID mfd-prd-channel --name basic --version 1.0 --sequence ${VERSION} --tls --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem" --output json
}

# CheckCommitMfdWhs(){

# }

# CheckCommitWhsRtlr(){

# }


CommitCCMfdPrd(){
    echo "******************** Making commit **********************"
    sudo docker exec -it cli-manufacturer-1 peer lifecycle chaincode commit -o orderer1.gov.io:7050 --channelID mfd-prd-channel --name basic --version 1.0 --sequence ${VERSION} --tls --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem" --peerAddresses peertf1.production.com:8050 --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/production.com/peers/peertf1.production.com/tls/ca.crt" --peerAddresses peertm1.manufacturer.com:9050 --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.com/peers/peertm1.manufacturer.com/tls/ca.crt"

    sleep 8
}

InstantiateCCMfdPrd(){
    echo "Instantiating CC on Production peer-1"
    sudo docker exec -it cli-production-1 peer chaincode instantiate -o orderer1.gov.io:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem -C mfd-prd-channel -n basic -v 1.0 -c '{"Args":["init"]}' -P "AND ('tataMSP.peer','teafarmMSP.peer')"

    sleep 8

    echo "Instantiating CC on Manufacture peer-1"
   sudo docker exec -it cli-manufacturer-1 peer chaincode instantiate -o orderer1.gov.io:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem -C mfd-prd-channel -n basic -v 1.0 -c '{"Args":["init"]}' -P "AND ('tataMSP.peer','teafarmMSP.peer')"

    sleep 8
}

InvokeCCMfdPrd(){
    echo "****** Invoking ChainCode On Mfc-Prd-Channel *********"
    sudo docker exec -it cli-production-1 peer chaincode invoke -o orderer1.gov.io:7050 --tls --cafile "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/gov.io/orderers/orderer1.gov.io/msp/tlscacerts/tlsca.gov.io-cert.pem" -C mfd-prd-channel -n basic --peerAddresses peertf1.production.com:8050 --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/production.com/peers/peertf1.production.com/tls/ca.crt" --peerAddresses peertm1.manufacturer.com:9050 --tlsRootCertFiles "/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.com/peers/peertm1.manufacturer.com/tls/ca.crt" -c '{"function":"init","Args":["1000"]}'
    sleep 8
}

QueryCCMfdPrd(){  
    echo "*********************** Query ChainCode For Mfd-Prd-Channel , Fetching Balance Of Manufacturer *********************************"
    sudo docker exec -it cli-manufacturer-1 peer chaincode query -C mfd-prd-channel -n basic -c '{"Args":["getManufacturerFunds"]}'

    sleep 8

    echo "*********************** Query ChainCode For Mfd-Prd-Channel , Fetching Balance Of Production *********************************"
    sudo docker exec -it cli-manufacturer-1 peer chaincode query -C mfd-prd-channel -n basic -c '{"Args":["getProducerFunds"]}'

    sleep 8

    echo "*********************** Query ChainCode For Mfd-Prd-Channel , Fetching Initial Production Stock *********************************"
    sudo docker exec -it cli-manufacturer-1 peer chaincode query -C mfd-prd-channel -n basic -c '{"Args":["availableStock"]}'

}

PlaceOrder(){
        echo "*********************** Query ChainCode For Mfd-Prd-Channel , Placing Order *********************************"
    sudo docker exec -it cli-manufacturer-1 peer chaincode query -C mfd-prd-channel -n basic -c '{"Args":["placeOrder","2","INDIA","DELHI"]}'

    sleep 8
        echo "*********************** Query ChainCode For Mfd-Prd-Channel , Query Order *********************************"
    sudo docker exec -it cli-manufacturer-1 peer chaincode query -C mfd-prd-channel -n basic -c '{"Args":["getOrderDetails","1"]}'

    sleep 8

    sudo docker exec -it cli-manufacturer-1 peer chaincode query -C mfd-prd-channel -n basic -c '{"Args":["availableStock2"]}'

}

mfdPrdCC
# mfdWhsCC
# whsRtlrCC
ApproveCCMfdPrd
CheckCommitMfdPrd
# CheckCommitMfdWhs
# CheckCommitWhsRtlr
CommitCCMfdPrd
# InstantiateCCMfdPrd
InvokeCCMfdPrd
QueryCCMfdPrd
PlaceOrder
