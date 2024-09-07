from flask import Flask, request, jsonify, send_file, render_template
from imdb import IMDb
from bs4 import BeautifulSoup
import requests
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import matplotlib
from textblob import TextBlob
import random
import nltk
from nltk.corpus import stopwords
import io
import base64
from openai import OpenAI
import os
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import defaultdict

nltk.download('stopwords')

app = Flask(__name__)

matplotlib.use('Agg')

@app.route('/')
def index():
    return render_template('/movie.html')

@app.route('/get_actor_info', methods=['POST'])
def get_actor_info():
    actor_name = request.json['actor']
    print(f"Received actor name: {actor_name}")  # Debugging

    description = get_actor_description(actor_name)

    if description == "This is not an actor/actress!":
        response = {"result": f"Actor/Actress Not Found: '{actor_name}'"}
    else:
        actor_id = get_actor_id(actor_name)
        movies = get_actor_movies(actor_id)
        top5_movies = get_top5_movies(movies)
        print(f"Top 5 movies: {top5_movies}")  # Debugging

        # Fetch reviews for the word cloud
        reviews = []
        for m in movies:
            reviews += get_reviews(m[1])

        wordcloud = generate_sentiment_wordcloud(reviews)

        # Generate actor description and top 5 movies separately
        description, movie_data = get_result_message(description, top5_movies, actor_name)
        print(f"Description: {description}")  # Debugging

        # Prepare the response with both the description and the movie data
        response = {
            "description": description + f"Below is some statistical data about {actor_name}:",
            "movies": movie_data,
            "wordcloud": wordcloud
        }

    return jsonify(response)



def get_actor_id(actor_name):
    ia = IMDb()
    people = ia.search_person(actor_name)
    if people:
        actor = people[0]
        actor_id = actor.personID
        return actor_id
    else:
        return f"Actor not found: {actor_name}"
    
def get_actor_movies(actor_id):
    ia = IMDb()
    actor_infos = ia.get_person_awards(actor_id)
    movie_objects = list(actor_infos['titlesRefs'].keys())
    movies = []
    for item in movie_objects:
        item_id = ia.search_movie(item)[0].getID()
        movies.append((item, item_id))
    return movies

def get_movie_page(movie_id):
    url = 'https://www.imdb.com/title/tt' + movie_id + '/reviews/'
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'html.parser')
    raw_content = soup.find_all('div', attrs= {'class': 'lister-item mode-detail imdb-user-review collapsable'})
    return raw_content

def get_average_rating(movie_id):
    raw_content = get_movie_page(movie_id)
    ratings = []
    for review in raw_content:
        rating_tag = review.find('span', class_='rating-other-user-rating')
        if rating_tag:
            rating = rating_tag.find('span').text
            ratings += [float(rating)]
    if len(ratings) > 0:
        return round(sum(ratings)/len(ratings), 1)
    else:
        return 0

def get_reviews(movie_id):
    page_content = get_movie_page(movie_id)
    reviews = []
    for c in page_content:
        review_text = c.find('div', class_='text show-more__control').text.strip()
        reviews += [review_text]
    return reviews

def get_top5_movies(movies: list):
    temp = []
    for movie in movies:
        m_rating = get_average_rating(movie[1])
        temp += [(movie[0], movie[1], m_rating)]
    sorted_movies = sorted(temp, key = lambda x: x[2])
    return sorted_movies[-5:]

def has_sentiment(word):
    blob = TextBlob(word)
    return blob.sentiment.polarity != 0

def sentiment_color(word, **kwargs):
    blob = TextBlob(word)
    polarity = blob.sentiment.polarity
    if polarity > 0:
        return "green"  # Positive sentiment
    elif polarity < 0:
        return "red"    # Negative sentiment
    else:
        return "gray"   # Neutral sentiment

def generate_sentiment_wordcloud(strings_list):
    combined_text = ' '.join(strings_list)
    stop_words = set(stopwords.words('english'))
    filtered_words = [word for word in combined_text.split() if word.lower() not in stop_words and has_sentiment(word)]
    filtered_text = ' '.join(filtered_words)
    
    # Generate the word cloud with the Agg backend
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(filtered_text)

    # Save the word cloud to an in-memory file (no Tkinter interaction)
    img = io.BytesIO()
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud.recolor(color_func=sentiment_color), interpolation='bilinear')
    plt.axis('off')
    plt.savefig(img, format='PNG')
    img.seek(0)

    # Encode the image to base64 to send to the frontend
    img_base64 = base64.b64encode(img.getvalue()).decode('utf-8')
    plt.close()
    return img_base64


def get_actor_description(actor_name):
    client = OpenAI()

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{ "role": "system", "content": "You are an expert on film industry and you know everything about all actors/actresses." },
                {"role": "user", 
                "content": f"Do your research and give me 2 sentences description about {actor_name}. If this is not an actor/actress, please say exactly 'This is not an actor/actress!'"}]
    )

    return completion.choices[0].message.content


    
def get_result_message(description: str, top_movies: list, actor_name):
    if description != "This is not an actor/actress!":
        result = "*"*130 + '\n' + f"{actor_name}'s best 5 movies by IMDB reviewers:\n"

        movie_list = []
        for movie in top_movies[::-1]:  # Reverse to display highest-rated first
            movie_list.append({"title": movie[0], "rating": movie[2]})

        # Return both description and the formatted movie data
        return description, movie_list
    else:
        return "This is not an actor/actress!", []



if __name__ == "__main__":
    app.run(debug=True)