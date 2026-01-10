// Bad idea; it updates title multiple times
this.title = this.title.toUpperCase();
this.title = this.title.trim();

if (this.title.length > 20) {
    this.title = this.title.substring(0, 20) + '...';
}

// Much better; title is only updated once
let updatedTitle = this.title;
updatedTitle = updatedTitle.toUpperCase();
updatedTitle = updatedTitle.trim();

if (updatedTitle.length > 20) {
    updatedTitle = updatedTitle.substring(0, 20) + '...';
}

this.title = updatedTitle;
