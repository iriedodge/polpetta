
// see polpetta.resolve
function resolve(src) {
  src = path.resolve(
		polpetta.root + systemPath(src)
	);
	// root must be at index 0
  return src.indexOf(polpetta.root) ? "" : src;
}