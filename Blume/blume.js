onload = () => {
    const c = setTimeout(() => {
      document.body.classList.remove("not-loaded");
      clearTimeout(c);
    }, 1000);
  };

  document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        window.location.href = "../Klasse/klasse.html"; 
    }
});