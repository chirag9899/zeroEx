function simpleFakeApiCall() {
  return new Promise((resolve) => {
    // Simulate an API call delay
    setTimeout(() => {
      resolve("Data retrieved successfully!");
    }, 2000); // 2 second delay
  });
}

async function depositFunds(amount: number) {
  await simpleFakeApiCall();
  console.log("Depositing funds...");
  // toast
}

export { simpleFakeApiCall, depositFunds };
