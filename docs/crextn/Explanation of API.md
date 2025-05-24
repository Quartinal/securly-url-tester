## Explanation of API *(LEGACY)*

CREXTN is Securly's way of communicating with any of its legacy extension IDs, approximately 10 to be exact, including its experimental deployments such as its new Think Twice extensions.

### How do we utilize it?

Well, there is an existent project called FilterLock by the Vortex Developer Labs team that attempts to make proxy links nearly unblockable and prevent automatic blocking, scanning, and mere detection (in the means of Securly's relatively new [`securly.com/crextn/proxy`](https://www.securly.com/crextn/proxy)) API which essentially is called from the extension's bundled `securly.min.js` file when a proxy is identified (usually through HTML scanning). FilterLock aims to solve many of these issues many hold grudges against due to the Securly team easily patching most bypasses (which of course is certainly criticizable).