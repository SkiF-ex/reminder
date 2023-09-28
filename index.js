const nullthrows = (element) => {
    if (element == null) throw new Error("it's a null");
    return element;
}

const injectCode = () => {
    const script = document.createElement('script');

    script.src = chrome.runtime.getURL('scripts/parse.js');
    script.onload = function () {
        this.remove();
    };

    nullthrows(document.head || document.documentElement).appendChild(script);
}

injectCode();