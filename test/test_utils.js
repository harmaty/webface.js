export async function fetch_dom(path) {
  var response = await fetch('http://localhost:8080/' + path);
  var body;
  await response.text().then((t) => body = t);
  return new DOMParser().parseFromString(body, "text/html").documentElement.querySelector("body");
}
