# webdev
Documenting my attempt at webdev (scary)

Visit it here: [https://mnjkhtri.github.io/webdev/]

Run locally:

1. Client way: just clone and open index.html

2. Web server way:

install apache2
```bash
sudo apt install apache2
```

now `sudo service apache2 start` puts a page from /var/www/html on localhost

remove that and replace with our project
```
rm /var/www/html/index.html
sudo cp -r ./ /var/www/html
```
