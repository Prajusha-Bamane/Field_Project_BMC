function getPrediction() {
  const soil = document.getElementById("soil").value;
  const season = document.getElementById("season").value;
  const rainfall = document.getElementById("rainfall").value;
  const temp = document.getElementById("temp").value;

  if (!soil || !season || !rainfall || !temp) {
    alert("Please fill all fields");
    return;
  }

  fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      soil: soil,
      season: season,
      rainfall: rainfall,
      temp: Number(temp)
    })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById("result").innerText =
      "Recommended Crop: " + data.recommended_crop;
  })
  .catch(err => {
    document.getElementById("result").innerText =
      "Server error. Is Flask running?";
  });
}
