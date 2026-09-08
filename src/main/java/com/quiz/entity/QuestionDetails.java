package com.quiz.entity;

import java.io.Serializable;
import java.util.List;

public class QuestionDetails implements Serializable {
    private String imageUrl;
    private List<String> options;
    private String keyword;

    public QuestionDetails() {
    }

    public QuestionDetails(String imageUrl, List<String> options, String keyword) {
        this.imageUrl = imageUrl;
        this.options = options;
        this.keyword = keyword;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }
}
