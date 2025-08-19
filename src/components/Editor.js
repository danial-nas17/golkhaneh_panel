// import React from "react";
// import { Editor } from "@tinymce/tinymce-react";
// import axios from "axios";

// export default function TinyEditor({
//   content,
//   onEditorChange,
//   model,
//   id,
//   height = 500,
// }) {
//   const getToken = () => {
//     return localStorage.getItem("token");
//   };

//   const api = axios.create({
//     baseURL: "https://api.emirateoptics.com/api/v1/",
//   });

//   api.interceptors.request.use(
//     (config) => {
//       const token = getToken();
//       if (token) {
//         config.headers["Authorization"] = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => {
//       return Promise.reject(error);
//     }
//   );

//   return (
//     <Editor
//       apiKey="puro19yxdiq5il0nwx10sm2dq0mkdfv0i97wyv3ls86dmt71"
//       value={content}
//       onEditorChange={onEditorChange}
//       init={{
//         height: height, // Now using the height prop
//         language: "en",
//         language_load: false,
//         directionality: "ltr",
//         a11y_advanced_options: true,
//         menubar: true,
//         plugins:
//           "advlist lists autolink charmap code codesample directionality emoticons anchor preview print link image searchreplace visualblocks code fullscreen insertdatetime media table paste codesample",
//         toolbar1:
//           "fontselect | fontsizeselect | formatselect | bold italic underline strikethrough forecolor backcolor | anchor link image media",
//         toolbar2:
//           "ltr rtl | alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | table removeformat code codesample | templateButton",
//         allow_html_in_named_anchor: true,
//         image_title: true,
//         automatic_uploads: false,
//         relative_urls: false,
//         file_picker_types: "image",
//         file_picker_callback: (cb, value, meta) => {
//           const input = document.createElement("input");
//           input.setAttribute("type", "file");
//           input.setAttribute("accept", "image/*");

//           input.addEventListener("change", (e) => {
//             const file = e.target.files[0];

//             const formData = new FormData();
//             formData.append("file", file);
//             formData.append("model", model); // Using the model prop here
//             if (id !== undefined) {
//               formData.append("model_id", id);
//             }

//             api
//               .post("panel/gallery/upload-editor-img", formData)
//               .then((response) => {
//                 const imageUrl =
//                   response?.data?.image?.original_url ||
//                   response?.data?.optimized_url;
//                 if (imageUrl) {
//                   cb(imageUrl, {
//                     title: file.name,
//                     alt: file.name,
//                   });
//                 } else {
//                   console.error("No image URL in response");
//                 }
//               })
//               .catch((error) => {
//                 console.error("Error uploading image:", error);
//               });
//           });

//           input.click();
//         },
//         content_style:
//           "body { font-family:Helvetica,Arial,sans-serif; font-size:16px }",
//       }}
//     />
//   );
// }
import React from "react";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";

export default function TinyEditor({
  content,
  onEditorChange,
  model,
  id,
  height = 500,
}) {
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const api = axios.create({
    baseURL: "https://api.digizooom.com/api/v1/",
  });

  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return (
    <Editor
      apiKey="qxftbzgdfrvspuq3nyj4brdbjppw70mupn951yoswl6443d7"
      value={content}
      onEditorChange={onEditorChange}
      init={{
        height: height,
        language: "fa",
        language_load: false,
        directionality: "rtl",
        a11y_advanced_options: true,
        menubar: true,
        plugins:
          "advlist lists autolink charmap code codesample directionality emoticons anchor preview print link image searchreplace visualblocks code fullscreen insertdatetime media table paste codesample",
        toolbar1:
          "fontselect | fontsizeselect | formatselect | bold italic underline strikethrough forecolor backcolor | anchor link image media",
        toolbar2:
          "ltr rtl | alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | table removeformat code codesample | templateButton",
        allow_html_in_named_anchor: true,
        image_title: true,
        automatic_uploads: false,
        relative_urls: false,
        file_picker_types: "image",
        file_picker_callback: (cb, value, meta) => {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");

          input.addEventListener("change", (e) => {
            const file = e.target.files[0];

            const formData = new FormData();
            formData.append("file", file);
            formData.append("model", model); // Using the model prop here
            if (id !== undefined) {
              formData.append("model_id", id);
            }

            api
              .post("panel/gallery/upload-editor-img", formData)
              .then((response) => {
                const imageUrl =
                  response?.data?.image?.original_url ||
                  response?.data?.optimized_url;
                if (imageUrl) {
                  cb(imageUrl, {
                    title: file.name,
                    alt: file.name,
                  });
                } else {
                  console.error("No image URL in response");
                }
              })
              .catch((error) => {
                console.error("Error uploading image:", error);
              });
          });

          input.click();
        },
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:16px }",
      }}
    />
  );
}
