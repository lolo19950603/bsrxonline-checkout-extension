import {
  useApplyAttributeChange,
  Banner,
  useCartLines,
  BlockSpacer,
  Divider,
  Heading,
  reactExtension,
  Checkbox,
  InlineStack,
  TextField,
  Select,
  useApplyShippingAddressChange,
  View,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";
import {
  provinceList,
  clinicsDataHomepharma,
  clinicsDataInfusion,
} from "../data/BillingAddresses.jsx";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  // State to handle the checkboxes and inputs/dropdown
  const applyAttributeChange = useApplyAttributeChange();
  const applyShippingAddressChange = useApplyShippingAddressChange();
  const [isPssChecked, setIsPssChecked] = useState(false);
  const [isHomePharmaChecked, setIsHomePharmaChecked] = useState(false);
  const [isIcnChecked, setIsIcnChecked] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedClinic, setSelectedClinic] = useState("");
  const [pssProgramList, setPssProgramList] = useState([]);
  const [hasInfusionClinicOrHomePharma, setHasInfusionClinicOrHomePharma] =
    useState(false);
  const [hasMeds, setHasMeds] = useState(false);
  const [isOkToShowIcnHomePharmaBanner, setIsOkToShowIcnHomePharmaBanner] =
    useState(false);

  // Access cart lines using the useCartLines hook
  const cartLines = useCartLines();
  // Effect to check for "ICN/HOMEPHARMA" when the component is rendered
  useEffect(() => {
    const programList = [];
    for (let i = 0; i < cartLines.length; i++) {
      const line = cartLines[i];

      // Check if attributes exist and if any attribute value contains "ICN/HOMEPHARMA"
      if (line.attributes) {
        for (let j = 0; j < line.attributes.length; j++) {
          const attribute = line.attributes[j];
          if (attribute.key === "tag") {
            if (
              attribute.value === "ICN/HOMEPHARMA" ||
              attribute.value === "Management"
            ) {
              if (hasInfusionClinicOrHomePharma === false) {
                if (line.merchandise.sku === "MED") {
                  setHasMeds(true);
                  setIsIcnChecked(true);
                }
                setHasInfusionClinicOrHomePharma(true);
                setIsOkToShowIcnHomePharmaBanner(true);
              }
            } else {
              if (!programList.includes(attribute.value)) {
                if (attribute.value === "sanofi-hemophilia-alprolix-eloctate") {
                  programList.push("Hemophilia");
                } else if (
                  attribute.value === "opdivo-yervoy-regimen-and-opdualag"
                ) {
                  programList.push("Access to Hope");
                } else {
                  programList.push(attribute.value);
                }
              }
              setIsPssChecked(true);
            }
          }
        }
      }
    }
    setPssProgramList(programList);
  }, []); // Run this effect whenever cartLines changes

  // Function to handle province change
  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedClinic(""); // Reset clinic when province changes
    setIsOkToShowIcnHomePharmaBanner(true);
  };

  // Function to handle clinic selection
  const handleClinicChange = (value) => {
    setSelectedClinic(value);
    updateAddresses(value);
    setIsOkToShowIcnHomePharmaBanner(false);
  };

  const updateAddresses = async (clinicKey) => {
    if (isIcnChecked) {
      const clinicData = clinicsDataInfusion[selectedProvince][clinicKey];
      if (clinicData) {
        await applyAttributeChange({
          key: "ICN/HOME PHARMA Account",
          type: "updateAttribute",
          value: clinicKey,
        });
        // Update ICN shipping address
        await applyShippingAddressChange({
          key: "shippingAddress",
          type: "updateShippingAddress",
          address: {
            company: clinicKey,
            address1: clinicData.Address,
            address2: "",
            city: clinicData.City,
            provinceCode: clinicData.Province,
            countryCode: "CA",
            zip: clinicData["Postal Code"],
            phone: clinicData["Phone No."],
            oneTimeUse: true,
          },
        });
      }
    } else if (isHomePharmaChecked) {
      const clinicData = clinicsDataHomepharma[selectedProvince][clinicKey];
      if (clinicData) {
        await applyAttributeChange({
          key: "ICN/HOME PHARMA Account",
          type: "updateAttribute",
          value: clinicKey,
        });
        await applyShippingAddressChange({
          key: "shippingAddress",
          type: "updateShippingAddress",
          address: {
            address2: " ",
            oneTimeUse: true,
          },
        });
      }
    }
  };

  // Get the clinics based on the selected province and the checked clinic type
  const getClinicsForProvince = () => {
    if (isHomePharmaChecked && selectedProvince) {
      return Object.keys(clinicsDataHomepharma[selectedProvince] || {}).map(
        (clinicKey) => ({
          label: clinicKey,
          value: clinicKey,
        })
      );
    }

    if (isIcnChecked && selectedProvince) {
      return Object.keys(clinicsDataInfusion[selectedProvince] || {}).map(
        (clinicKey) => ({
          label: clinicKey,
          value: clinicKey,
        })
      );
    }

    return [];
  };

  // 2. Render the UI with checkboxes
  return (
    <>
      {(hasInfusionClinicOrHomePharma || isPssChecked) && (
        <>
          <Heading level={3}>Billing</Heading>
          {hasInfusionClinicOrHomePharma && !hasMeds && (
            <View>
              <BlockSpacer spacing="base" />
              <InlineStack>
                <Checkbox
                  id="checkbox-home-pharma"
                  name="checkbox-home-pharma"
                  onChange={handleHomePharmaChange}
                  label="Home Pharma"
                  value="home-pharma"
                  checked={isHomePharmaChecked}
                >
                  Home Pharma
                </Checkbox>
                <Checkbox
                  id="checkbox-infusion-clinic"
                  name="checkbox-infusion-clinic"
                  onChange={handleIcnChange}
                  label="Infusion Clinic"
                  value="infusion-clinic"
                  checked={isIcnChecked}
                >
                  Infusion Clinic
                </Checkbox>
              </InlineStack>
            </View>
          )}
          {/* Show a dropdown when either Home Pharma or ICN is selected */}
          {(isHomePharmaChecked || isIcnChecked) && (
            <>
              <BlockSpacer spacing="extraTight" />
              <Heading level={4}>
                {isHomePharmaChecked ? "Home Pharma" : "Infusion Clinic"}
              </Heading>
              <BlockSpacer spacing="tight" />
              <Select
                label="Select Province"
                options={Object.entries(provinceList).map(
                  ([key, province]) => ({
                    label: province,
                    value: province,
                  })
                )}
                value={selectedProvince}
                onChange={handleProvinceChange}
              />
            </>
          )}
          {/* Clinic Select Dropdown based on the selected province */}
          {selectedProvince && (
            <>
              <BlockSpacer spacing="extraTight" />
              <Select
                label="Select Clinic"
                options={getClinicsForProvince()}
                value={selectedClinic}
                onChange={handleClinicChange}
              />
            </>
          )}
          {isOkToShowIcnHomePharmaBanner && (
            <>
              {/* Banner for infusion clinic/home pharma supplies */}
              <BlockSpacer spacing="tight" />
              <Banner status="critical">
                Your cart has infusion clinic/home pharma supplies. Please
                select appropriate billing; failure to do so will result in
                order cancellation.
              </Banner>
            </>
          )}
          {hasMeds && (
            <>
              <BlockSpacer spacing="extraTight" />
              <Banner status="warning">
                There is medicaiton in the order, order can only be shipped
                to the clinic.
              </Banner>
            </>
          )}
          {isIcnChecked && hasInfusionClinicOrHomePharma && (
            <>
              <BlockSpacer spacing="extraTight" />
              <Banner status="warning">
                Supplies can only be sent to the clinic. Please do not modify
                the shipping address, as failure to do so will result in order
                cancellation. If you have any special requests, please enter
                your requests on delivery instructions section for approval.
              </Banner>
            </>
          )}
          {/* Show two input fields when PSS is selected */}
          {isPssChecked && (
            <>
              <BlockSpacer spacing="base" />
              <Heading level={4}>PSS</Heading>
              <BlockSpacer spacing="tight" />
              <Banner status="info">
                Please enter appropriate patient ID.
              </Banner>
              {/* <BlockSpacer spacing="tight" /> */}
              {/* Dynamic Input Fields for PSS Programs */}
              <View>
                {pssProgramList.map((program, index) => (
                  <View key={index}>
                    <BlockSpacer spacing="tight" />
                    <TextField
                      disabled={true}
                      label={`PSS Program Name ${index + 1}`}
                      name={`pss-program-name-${index}`}
                      value={program.toUpperCase()} // Assuming 'name' is a property of each program in the list
                    />
                    <BlockSpacer spacing="extraTight" />
                    <TextField
                      label="Patient ID"
                      name={`patient-id-${index}`}
                      onChange={(value) =>
                        handlePatientIdInputChange(program, value)
                      }
                      value=""
                    />
                    <BlockSpacer spacing="extraTight" />
                  </View>
                ))}
              </View>
            </>
          )}
          <BlockSpacer spacing="base" />
          <Divider />
          <BlockSpacer spacing="base" />
          <BlockSpacer spacing="loose" />
        </>
      )}
      <Heading level={3}>Delivery Instructions</Heading>
      <BlockSpacer spacing="tight" />
      <Banner status="info">
        Please let us know if you have special delivery instruction/request.
      </Banner>
      <TextField
        label="Delivery Instructions"
        name="delivery-instructions"
        onChange={handleDeliveryInstructionsChange}
        value=""
      />
      <BlockSpacer spacing="loose" />
      <Divider />
    </>
  );

  async function handleDeliveryInstructionsChange(value) {
    await applyAttributeChange({
      key: "Delivery Instructions:",
      type: "updateAttribute",
      value: value,
    });
  }

  async function handlePatientIdInputChange(program, value) {
    // 4. Call the API to modify checkout
    await applyAttributeChange({
      key: program.toUpperCase(),
      type: "updateAttribute",
      value: value,
    });
  }

  // Handlers for checkbox changes
  function handleHomePharmaChange(isChecked) {
    if (isChecked) {
      setIsIcnChecked(false); // Uncheck Infusion Clinic if Home Pharma is checked
      setSelectedProvince("");
    } else {
      setSelectedProvince("");
      setIsOkToShowIcnHomePharmaBanner(false);
    }
    setIsHomePharmaChecked(isChecked);
    setIsOkToShowIcnHomePharmaBanner(true);
  }

  function handleIcnChange(isChecked) {
    if (isChecked) {
      setIsHomePharmaChecked(false); // Uncheck Home Pharma if Infusion Clinic is checked
      setSelectedProvince("");
    } else {
      setSelectedProvince("");
      setIsOkToShowIcnHomePharmaBanner(false);
    }
    setIsIcnChecked(isChecked);
    setIsOkToShowIcnHomePharmaBanner(true);
  }
}
