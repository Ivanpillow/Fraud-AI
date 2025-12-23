def save_prediction(db, prediction):
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction