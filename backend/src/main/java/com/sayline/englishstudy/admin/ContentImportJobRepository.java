package com.sayline.englishstudy.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContentImportJobRepository extends JpaRepository<ContentImportJob, Long> {

    Page<ContentImportJob> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<ContentImportJob> findTop20ByStatusInOrderByCreatedAtDesc(List<ImportStatus> statuses);
}
