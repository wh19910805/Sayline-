package com.sayline.englishstudy.admin;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.user.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {

    private final AdminAuditLogRepository repository;
    private final UserRepository userRepository;

    public AdminAuditService(AdminAuditLogRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public void log(AuthenticatedUser actor, String action, String entityType, Object entityId, String detail) {
        AdminAuditLog log = new AdminAuditLog();
        if (actor != null) {
            log.setActor(userRepository.getReferenceById(actor.id()));
        }
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId == null ? null : entityId.toString());
        log.setDetail(detail);
        repository.save(log);
    }
}
