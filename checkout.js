const stripe = Stripe("pk_live_51Ri18DJU8UI8wMKYaky2JTC3gpMCdwTUseTSP8EBRqAlWAXponZshrL2s05SiXWSpAFTDrIBeiByo4EBmSrllEkB00y9VFhUZt");

let checkout;
initialize();

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

async function initialize() {
  const urlParams = new URLSearchParams(window.location.search);
  const priceId = urlParams.get("priceId");

  if (!priceId) {
    showMessage("Missing priceId in URL");
    return;
  }

  const response = await fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  const data = await response.json();

  if (data.error) {
    showMessage(data.error);
    return;
  }

  // Optionally show product info
  if (data.product) {
    const nameEl = document.getElementById("product-name");
    const imageEl = document.getElementById("product-image");
    nameEl.textContent = data.product.name;
    imageEl.src = data.product.image;
  }

  const appearance = {
    theme: 'stripe',
    variables: { colorPrimary: '#E500FF' },
  };

  checkout = await stripe.initCheckout({
    fetchClientSecret: () => data.clientSecret,
    elementsOptions: { appearance },
  });

  const paymentElement = checkout.createPaymentElement();
  paymentElement.mount("#payment-element");

  const shippingAddressElement = checkout.createShippingAddressElement();
  shippingAddressElement.mount("#shipping-address-element");

  document.getElementById("button-text").textContent = `Pay ${checkout.session().total.total.amount} now`;
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await checkout.confirm();
  if (error) showMessage(error.message);

  setLoading(false);
}

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");
  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;
  setTimeout(() => {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

function setLoading(isLoading) {
  const btn = document.getElementById("submit");
  const spinner = document.getElementById("spinner");
  const btnText = document.getElementById("button-text");

  btn.disabled = isLoading;
  spinner.classList.toggle("hidden", !isLoading);
  btnText.classList.toggle("hidden", isLoading);
}
