---
title: "SoLExS Solar Flare Explorer"
subtitle: "Study solar flares and other phenomena using data from ISRO's Aditya-L1 space observatory."
author: "Mahesh Shantaram"
status: published
date: 2025-01-01
heroImage: "/library/throwaways/image9-spacewoman.jpg"
geography: ["india"]
theme: ["datastory", "space", "data analysis", "solar"]
notebook:
  engine: "jupyter"
  entry: "https://github.com/thecont1/aditya-L1-solar-explorer/blob/main/sun-explorer.ipynb"
  excludeCodeCells: true
toc: true
---

<!-- NOTEBOOK_HTML_START -->
<main>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-0:-Introduction">🌞 0: Introduction</h2><p>Aditya-L1 is a solar observatory positioned 1.5 million kilometers from Earth at a place called the Lagrangian point L1, providing a continuous view of the Sun.</p>
<p>SoLEXS is a spectrometer aboard Aditya-L1 that monitors X-ray emissions from the Sun, every second. This data is valuable for studying solar flares, which are bursts of energy released by the Sun.</p>
<h4 id="%F0%9F%9A%80-ADITYA_L1_EPOCH_UNIX-=-1693630800">🚀 <code>ADITYA_L1_EPOCH_UNIX</code> = 1693630800</h4><h4 id="%F0%9F%9A%80-ADITYA_L1_EPOCH_UTC-=-2023-09-02T06:20:00-UTC">🚀 <code>ADITYA_L1_EPOCH_UTC</code> = 2023-09-02T06:20:00 UTC</h4><img alt="It's May 2025. Are solar flares something I should be worried about?" src="https://raw.githubusercontent.com/thecont1/aditya-L1-solar-explorer/main/images/image4-perplexity.png" width="804"/>
<p>Source: <a href="https://www.perplexity.ai/search/it-s-may-2025-are-solar-flares-5L6mDRh2QIyXAVsPQQk8Vw#0">www.perplexity.ai/search/it-s-may-2025-are-solar-flares...</a></p>
</div>
</div>
</div>
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-1:-Set-up-the-environment">🌞 1: Set up the environment</h2><p>This cell imports necessary libraries for data handling, plotting, and interactive features. It sets up the environment for reading solar data and creating visualizations.</p>
<ol>
<li><p><code>pandas</code> for data manipulation and analysis.</p>
</li>
<li><p><code>matplotlib.pyplot</code> for creating plots and figures.</p>
</li>
<li><p><code>astropy.io.fits</code> to read FITS-format files containing your lightcurve data.</p>
</li>
<li><p><code>astropy.time.Time</code> for converting Unix timestamps into human-readable dates/times.</p>
</li>
<li><p><code>gzip</code> and <code>zipfile</code> for handling compressed files.</p>
</li>
<li><p><code>tqdm</code> and <code>ipywidgets</code> for visualization and interactive widgets.</p>
</li>
<li><p><code>ipydatetime</code> for interactive date/time selection.</p>
</li>
</ol>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noOutputs jp-mod-noInput">
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-2:-Take-a-closer-look-at-the-.lc-LightCurve-file">🌞 2: Take a closer look at the <code>.lc</code> LightCurve file</h2><p>This cell demonstrates how to inspect a sample lightcurve file, showing its structure and header information to help understand the data format before processing.</p>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noInput">
<div class="jp-Cell-outputWrapper">
<div class="jp-Collapser jp-OutputCollapser jp-Cell-outputCollapser">
</div>
<div class="jp-OutputArea jp-Cell-outputArea">
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Most recent data file: AL1_SLX_L1_20251003_v1.0.zip
</pre>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-OutputArea-output" data-mime-type="text/markdown" tabindex="0">
<table>
<thead>
<tr>
<th style="text-align:right">No.</th>
<th style="text-align:left">Name</th>
<th style="text-align:right">Ver</th>
<th style="text-align:left">Type</th>
<th style="text-align:right">Cards</th>
<th style="text-align:left">Dimensions</th>
<th style="text-align:left">Format</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:right">0</td>
<td style="text-align:left">PRIMARY</td>
<td style="text-align:right">1</td>
<td style="text-align:left">PrimaryHDU</td>
<td style="text-align:right">15</td>
<td style="text-align:left"></td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:right">1</td>
<td style="text-align:left">RATE</td>
<td style="text-align:right">1</td>
<td style="text-align:left">BinTableHDU</td>
<td style="text-align:right">39</td>
<td style="text-align:left">86400R x 2C</td>
<td style="text-align:left">[D, D]</td>
</tr>
</tbody>
</table>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-OutputArea-output" data-mime-type="text/markdown" tabindex="0">
<h2 id="Primary-HDU-Header">Primary HDU Header</h2><table>
<thead>
<tr>
<th style="text-align:left">Keyword</th>
<th style="text-align:left">Value</th>
<th style="text-align:left">Comment</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left">SIMPLE</td>
<td style="text-align:left">True</td>
<td style="text-align:left">conforms to FITS standard</td>
</tr>
<tr>
<td style="text-align:left">BITPIX</td>
<td style="text-align:left">8</td>
<td style="text-align:left">array data type</td>
</tr>
<tr>
<td style="text-align:left">NAXIS</td>
<td style="text-align:left">0</td>
<td style="text-align:left">number of array dimensions</td>
</tr>
<tr>
<td style="text-align:left">EXTEND</td>
<td style="text-align:left">True</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">MISSION</td>
<td style="text-align:left">ADITYA-L1</td>
<td style="text-align:left">Name of mission/satellite</td>
</tr>
<tr>
<td style="text-align:left">TELESCOP</td>
<td style="text-align:left">AL1</td>
<td style="text-align:left">Name of mission/satellite</td>
</tr>
<tr>
<td style="text-align:left">INSTRUME</td>
<td style="text-align:left">SoLEXS</td>
<td style="text-align:left">Name of Instrument/detector</td>
</tr>
<tr>
<td style="text-align:left">ORIGIN</td>
<td style="text-align:left">SoLEXSPOC</td>
<td style="text-align:left">Source of FITS file</td>
</tr>
<tr>
<td style="text-align:left">CREATOR</td>
<td style="text-align:left">solexs_pipeline-1.3</td>
<td style="text-align:left">Creator of file</td>
</tr>
<tr>
<td style="text-align:left">FILENAME</td>
<td style="text-align:left">AL1_SOLEXS_20251003_SDD2_L1.lc</td>
<td style="text-align:left">Name of file</td>
</tr>
<tr>
<td style="text-align:left">CONTENT</td>
<td style="text-align:left">LIGHT CURVE</td>
<td style="text-align:left">File content</td>
</tr>
<tr>
<td style="text-align:left">DATE</td>
<td style="text-align:left">2025-10-05</td>
<td style="text-align:left">Creation Date</td>
</tr>
<tr>
<td style="text-align:left">OBS_DATE</td>
<td style="text-align:left">20251003</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">OBS_ID</td>
<td style="text-align:left">N00_0000_000660</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">DATASUM</td>
<td style="text-align:left">0</td>
<td style="text-align:left">data unit checksum updated 2025-10-05T15:07:42</td>
</tr>
</tbody>
</table>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-OutputArea-output" data-mime-type="text/markdown" tabindex="0">
<h2 id="Table-HDU-Header">Table HDU Header</h2><table>
<thead>
<tr>
<th style="text-align:left">Keyword</th>
<th style="text-align:left">Value</th>
<th style="text-align:left">Comment</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left">XTENSION</td>
<td style="text-align:left">BINTABLE</td>
<td style="text-align:left">binary table extension</td>
</tr>
<tr>
<td style="text-align:left">BITPIX</td>
<td style="text-align:left">8</td>
<td style="text-align:left">array data type</td>
</tr>
<tr>
<td style="text-align:left">NAXIS</td>
<td style="text-align:left">2</td>
<td style="text-align:left">number of array dimensions</td>
</tr>
<tr>
<td style="text-align:left">NAXIS1</td>
<td style="text-align:left">16</td>
<td style="text-align:left">length of dimension 1</td>
</tr>
<tr>
<td style="text-align:left">NAXIS2</td>
<td style="text-align:left">86400</td>
<td style="text-align:left">length of dimension 2</td>
</tr>
<tr>
<td style="text-align:left">PCOUNT</td>
<td style="text-align:left">0</td>
<td style="text-align:left">number of group parameters</td>
</tr>
<tr>
<td style="text-align:left">GCOUNT</td>
<td style="text-align:left">1</td>
<td style="text-align:left">number of groups</td>
</tr>
<tr>
<td style="text-align:left">TFIELDS</td>
<td style="text-align:left">2</td>
<td style="text-align:left">number of table fields</td>
</tr>
<tr>
<td style="text-align:left">EXTNAME</td>
<td style="text-align:left">RATE</td>
<td style="text-align:left">Extension name</td>
</tr>
<tr>
<td style="text-align:left">CONTENT</td>
<td style="text-align:left">LIGHT CURVE</td>
<td style="text-align:left">File content</td>
</tr>
<tr>
<td style="text-align:left">HDUCLASS</td>
<td style="text-align:left">OGIP</td>
<td style="text-align:left">format conforms to OGIP standard</td>
</tr>
<tr>
<td style="text-align:left">HDUVERS</td>
<td style="text-align:left">1.1.0</td>
<td style="text-align:left">Version of format (OGIP memo CAL/GEN/92-002a)</td>
</tr>
<tr>
<td style="text-align:left">HDUDOC</td>
<td style="text-align:left">OGIP memos CAL/GEN/92-007</td>
<td style="text-align:left">Documents describing the format</td>
</tr>
<tr>
<td style="text-align:left">HDUVERS1</td>
<td style="text-align:left">1.0.0</td>
<td style="text-align:left">Obsolete - included for backwards compatibility</td>
</tr>
<tr>
<td style="text-align:left">HDUVERS2</td>
<td style="text-align:left">1.1.0</td>
<td style="text-align:left">Obsolete - included for backwards compatibility</td>
</tr>
<tr>
<td style="text-align:left">HDUCLAS1</td>
<td style="text-align:left">LIGHTCURVE</td>
<td style="text-align:left">Extension contains spectral data</td>
</tr>
<tr>
<td style="text-align:left">HDUCLAS2</td>
<td style="text-align:left">TOTAL</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">HDUCLAS3</td>
<td style="text-align:left">COUNTS</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">FILTER</td>
<td style="text-align:left">SDD2</td>
<td style="text-align:left">Filter used</td>
</tr>
<tr>
<td style="text-align:left">TTYPE1</td>
<td style="text-align:left">TIME</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TFORM1</td>
<td style="text-align:left">D</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TTYPE2</td>
<td style="text-align:left">COUNTS</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TFORM2</td>
<td style="text-align:left">D</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">CREATOR</td>
<td style="text-align:left">solexs_pipeline-1.3</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TSTART</td>
<td style="text-align:left">1759449600.0</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TSTOP</td>
<td style="text-align:left">1759535999.0</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TIMEDEL</td>
<td style="text-align:left">1</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TIMZERO</td>
<td style="text-align:left">0</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">MJDREFI</td>
<td style="text-align:left">40587</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">MJDREFF</td>
<td style="text-align:left">0</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TIMESYS</td>
<td style="text-align:left">UTC</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TIMEREF</td>
<td style="text-align:left">LOCAL</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TIMEUNIT</td>
<td style="text-align:left">s</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">DATE-OBS</td>
<td style="text-align:left">2025-10-03 00:00:00</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">DATE-END</td>
<td style="text-align:left">2025-10-03 23:59:59</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">TELESCOP</td>
<td style="text-align:left">AL1</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">INSTRUME</td>
<td style="text-align:left">SoLEXS</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">NUMBAND</td>
<td style="text-align:left">4</td>
<td style="text-align:left"></td>
</tr>
<tr>
<td style="text-align:left">DATASUM</td>
<td style="text-align:left">194828409</td>
<td style="text-align:left">data unit checksum updated 2025-10-05T15:07:42</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</div>
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-3:-Load-the-SoLEXS-data">🌞 3: Load the SoLEXS data</h2><p>This cell contains the <code>load_solexs_data</code> function, which reads and processes solar data from ZIP files, handles caching, and outputs a DataFrame for analysis.</p>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noInput">
<div class="jp-Cell-outputWrapper">
<div class="jp-Collapser jp-OutputCollapser jp-Cell-outputCollapser">
</div>
<div class="jp-OutputArea jp-Cell-outputArea">
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Found 2 paths in SoLEXS_dataset.paths
Found 22 ZIP files in data/solexs_202509
Found 3 ZIP files in data/solexs_202510
Processing 25 ZIP files from 2 paths
</pre>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Loading FITS data:   0%|          | 0/25 [00:00&lt;?, ? files/s]</pre>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Built fresh dataset with 2,160,000 rows from 25 files
</pre>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedHTMLCommon jp-RenderedHTML jp-OutputArea-output" data-mime-type="text/html" tabindex="0">
<div>

<table border="1" class="dataframe">
<thead>
<tr style="text-align: right;">
<th></th>
<th>DATE</th>
<th>TIME</th>
<th>COUNTS</th>
</tr>
</thead>
<tbody>
<tr>
<th>0</th>
<td>2025-09-01</td>
<td>1756684800</td>
<td>&lt;NA&gt;</td>
</tr>
<tr>
<th>1</th>
<td>2025-09-01</td>
<td>1756684801</td>
<td>41</td>
</tr>
<tr>
<th>2</th>
<td>2025-09-01</td>
<td>1756684802</td>
<td>30</td>
</tr>
<tr>
<th>3</th>
<td>2025-09-01</td>
<td>1756684803</td>
<td>31</td>
</tr>
<tr>
<th>4</th>
<td>2025-09-01</td>
<td>1756684804</td>
<td>33</td>
</tr>
<tr>
<th>...</th>
<td>...</td>
<td>...</td>
<td>...</td>
</tr>
<tr>
<th>2159995</th>
<td>2025-10-03</td>
<td>1759535995</td>
<td>34</td>
</tr>
<tr>
<th>2159996</th>
<td>2025-10-03</td>
<td>1759535996</td>
<td>32</td>
</tr>
<tr>
<th>2159997</th>
<td>2025-10-03</td>
<td>1759535997</td>
<td>32</td>
</tr>
<tr>
<th>2159998</th>
<td>2025-10-03</td>
<td>1759535998</td>
<td>36</td>
</tr>
<tr>
<th>2159999</th>
<td>2025-10-03</td>
<td>1759535999</td>
<td>34</td>
</tr>
</tbody>
</table>
<p>2160000 rows × 3 columns</p>
</div>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedHTMLCommon jp-RenderedHTML jp-OutputArea-output" data-mime-type="text/html" tabindex="0">
<div>

<table border="1" class="dataframe">
<thead>
<tr style="text-align: right;">
<th></th>
<th>DATE</th>
<th>TIME</th>
</tr>
</thead>
<tbody>
<tr>
<th>min</th>
<td>2025-09-01</td>
<td>1756684800</td>
</tr>
<tr>
<th>max</th>
<td>2025-10-03</td>
<td>1759535999</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedHTMLCommon jp-RenderedHTML jp-OutputArea-output" data-mime-type="text/html" tabindex="0">
<div>

<table border="1" class="dataframe">
<thead>
<tr style="text-align: right;">
<th></th>
<th>count</th>
<th>mean</th>
<th>min</th>
<th>25%</th>
<th>50%</th>
<th>75%</th>
<th>max</th>
<th>std</th>
</tr>
</thead>
<tbody>
<tr>
<th>COUNTS</th>
<td>2013512</td>
<td>38</td>
<td>0</td>
<td>13</td>
<td>23</td>
<td>38</td>
<td>1772</td>
<td>64</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</div>
</div>
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-4:-Setup-interactive-widgets-and-define-plotting-functions">🌞 4: Setup interactive widgets and define plotting functions</h2><p>This cell creates interactive date/time selectors and parameters, allowing users to customize the analysis range and sensitivity for solar flare detection.</p>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noOutputs jp-mod-noInput">
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noOutputs jp-mod-noInput">
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-5.-Set-control-variables-and-go-flare-hunting">🌞 5. Set control variables and go flare hunting</h2><ul>
<li><p><strong>Date and Time Selection</strong>: Allows you to specify the start and end dates/times for the data subset. This focuses the analysis on a particular period, making it easier to examine specific solar events.</p>
</li>
<li><p><strong>Sigma (σ)</strong>: A threshold for flare detection sensitivity. Higher values detect only stronger flares by requiring a larger deviation from the mean count rate, reducing false positives.</p>
</li>
<li><p><strong>Gap</strong>: Defines the minimum time interval (in seconds) between detected flares. It prevents closely spaced fluctuations from being counted as separate flares, ensuring more accurate event identification.</p>
</li>
<li><p><strong>Zoom start and end</strong>: Controls the range of the plot for detailed viewing. Set these to focus on a specific subset of the data timeline for in-depth analysis of individual flares.</p>
</li>
</ul>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noInput">
<div class="jp-Cell-outputWrapper">
<div class="jp-Collapser jp-OutputCollapser jp-Cell-outputCollapser">
</div>
<div class="jp-OutputArea jp-Cell-outputArea">
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>VBox(children=(HTML(value='&lt;h3&gt;Solar Flare Analysis Parameters&lt;/h3&gt;'), HBox(children=(VBox(children=(DatePicke…</pre>
</div>
</div>
</div>
</div>
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<hr/>
<h2 id="%F0%9F%8C%9E-6:-Plot-light-curves-and-detect-solar-flares">🌞 6: Plot light curves and detect solar flares</h2><p>This cell defines a function to plot light curves and detect solar flares based on user inputs, providing visual insights into the data.</p>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noInput">
<div class="jp-Cell-outputWrapper">
<div class="jp-Collapser jp-OutputCollapser jp-Cell-outputCollapser">
</div>
<div class="jp-OutputArea jp-Cell-outputArea">
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Button(button_style='info', description='Update', icon='refresh', style=ButtonStyle())</pre>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Output()</pre>
</div>
</div>
</div>
</div>
</div>
<div class="jp-Cell jp-MarkdownCell jp-Notebook-cell">
<div class="jp-Cell-inputWrapper" tabindex="0">
<div class="jp-Collapser jp-InputCollapser jp-Cell-inputCollapser">
</div>
<div class="jp-InputArea jp-Cell-inputArea"><div class="jp-InputPrompt jp-InputArea-prompt">
</div><div class="jp-RenderedHTMLCommon jp-RenderedMarkdown jp-MarkdownOutput" data-mime-type="text/markdown">
<h2 id="%F0%9F%8C%9E-7:-Zoom-into-the-wildest-flare">🌞 7: Zoom into the wildest flare</h2><p>This cell zooms into the largest flare detected in the previous step, providing a detailed view of its characteristics.</p>
</div>
</div>
</div>
</div><div class="jp-Cell jp-CodeCell jp-Notebook-cell jp-mod-noInput">
<div class="jp-Cell-outputWrapper">
<div class="jp-Collapser jp-OutputCollapser jp-Cell-outputCollapser">
</div>
<div class="jp-OutputArea jp-Cell-outputArea">
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Button(button_style='info', description='Update', icon='refresh', style=ButtonStyle())</pre>
</div>
</div>
<div class="jp-OutputArea-child">
<div class="jp-OutputPrompt jp-OutputArea-prompt"></div>
<div class="jp-RenderedText jp-OutputArea-output" data-mime-type="text/plain" tabindex="0">
<pre>Output()</pre>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- NOTEBOOK_HTML_END -->

