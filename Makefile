serve:
	python3 -m http.server 8008

extract:
	./.venv/bin/python scripts/extract_cv.py CV_MayChim_JRF.pdf

bake:
	./.venv/bin/python scripts/build_site_data_js.py

