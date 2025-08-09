serve:
	python3 -m http.server 8008

extract:
	python3 scripts/extract_cv.py CV_MayChim_JRF.pdf

bake:
	python3 scripts/build_site_data_js.py

feature-images:
	python3 scripts/fetch_feature_images.py && make bake

