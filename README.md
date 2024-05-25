# webdev
Documenting my attempt at webdev (scary)

Visit it here: [https://webdev-orcin.vercel.app/]


**As documents**: just clone and open index.html

**Through web server**:
```bash
sudo apt install apache2
```

now `sudo service apache2 start` puts a page from `/var/www/html` on localhost

remove that and replace with our project's static folder:
```
rm /var/www/html/index.html
sudo cp -r ./static /var/www/html
```

**Flask way**:
```
python3 app.py
```
