var form_data = new FormData();

$("#upload-img").change(function () {
  var files = $('#upload-img')[0].files;
  for (let i = 0; i < files.length; i++) {
    form_data.append('image', files[i]);
    const img = document.createElement("img");
    img.src = window.URL.createObjectURL(files[i]);
    img.className = "img-fluid img-thumbnail"
    img.onload = function() {
      window.URL.revokeObjectURL(this.src);
    }

    const div1 = document.createElement("div");
    div1.className = "col-lg-3 col-md-4 col-6 remove-img";
    const div2 = document.createElement("div");
    div2.className = "d-block mb-4 h-100";
    div1.appendChild(div2);
    div2.appendChild(img);
    $("#img-container")[0].appendChild(div1);
  }
  $('#save-btn').show();
});

$(document).ajaxSend(function() {
		$("#overlay").fadeIn(300);　
	});

$("#save-btn").click(function(){
  $.ajax({
    type: 'POST',
    url: '/upload',
    data: form_data,
    contentType: false,
    cache: false,
    processData: false,
    async: true
  }).done(function() {
    $('#save-btn').hide();
    setTimeout(function(){
      $("#overlay").fadeOut(300);
    },500);
    $(".remove-img").remove();
    form_data = new FormData();
  });
});
