package com.sayline.englishstudy.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Long> {

    List<CourseCategory> findByVisibleTrueOrderBySortOrderAscNameAsc();
}
