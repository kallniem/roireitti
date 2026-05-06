import fs from "fs";
/*
    Welcome cyclist certified products

                    query WelcomeCyclistCertifiedProducts {
                    certificate {
                            name
                        }
                        product(where: {productCertificates: {certificate: {_eq: "welcome_cyclist_certificate"}}}) {
                        id
                    }
                }
*/

const affiliates = [
    "3348558-5",
    "3136431-7",
    "2448061-9",
    "0357771-0",
    "2640679-7",
    "2931080-3",
    "2514272-6",
    "0892158-4",
    "2899280-6"
];

const TRAVELDATAHUB_API_KEY = import.meta.env.VITE_TRAVELDATAHUB_API_KEY;
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

async function geocodeAddress(address) {
    const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${MAPTILER_API_KEY}`
    );
    const data = await response.json();
    return data;
};

async function fetchBusinesses() {
    const response = await fetch("https://api.businessfinland.fi/traveldatahub", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "ocp-apim-subscription-key": TRAVELDATAHUB_API_KEY,
        },
        //GraphQL query
        body: JSON.stringify({
            query: `
                    query GetCompaniesInRovaniemi {
                    company(where: {postalAddresses: {city: {_eq: "Rovaniemi"}}}) {
                        id
                        businessEntity {
                        businessId
                        }
                        businessName
                        officialName
                        description
                        logoThumbnailUrl
                        logoUrl
                        postalAddresses {
                        city
                        postalCode
                        streetName
                        location
                        }
                        contactDetails {
                        email
                        phone
                        }
                        webshopUrl
                        websiteUrl
                        businessHours {
                        default {
                            closes
                            open
                            opens
                            weekday
                        }
                        }
                        socialMedia {
                        socialMediaLinks {
                            linkType
                            verifiedLink {
                            url
                            }
                        }
                        }
                    }
                    }
                    `,
            }),
        });

        const data = await response.json();
        let newData = []
        for (let company of data.data.company) {
            if (affiliates.includes(company.businessEntity.businessId)) {
                if (company.postalAddresses && company.postalAddresses.length > 0) {
                    company.coordinates = await geocodeAddress(`${company.postalAddresses[0].streetName} ${company.postalAddresses[0].postalCode} ${company.postalAddresses[0].city}`);
                    console.log(`Fetched coordinates for ${company.businessName}:`, company.coordinates);
                } else {
                    console.warn(`Company ${company.businessName} does not have a postal address.`);
                }
                newData.push(company);
            }
        };
        return newData;
};

// Write a JSON file with the fetched data
// const data = await fetchBusinesses();
// fs.writeFileSync("businesses.json", JSON.stringify(data, null, 2));